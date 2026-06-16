/**
 * @hermes/test-harness — Runtime Validators
 *
 * Runtime validation functions that verify the structural and
 * semantic invariants required for branded type construction.
 *
 * These validators are the gatekeepers: no branded type can be
 * constructed without passing through the corresponding validator.
 * They enforce:
 *   - Acyclicity of causal graphs
 *   - Parent event existence for non-genesis events
 *   - Causal depth consistency
 *   - Content hash integrity
 *   - Topological ordering correctness
 */

import { sealVerifiedCausalGraph, type VerifiedCausalGraph } from "./brands";

// ═══════════════════════════════════════════════════════════════
// Validation Result Types
// ═══════════════════════════════════════════════════════════════

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  details?: Record<string, unknown>;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
}

export interface DetailedValidationResult extends ValidationResult {
  warnings: ValidationWarning[];
}

function valid(): ValidationResult {
  return { valid: true, errors: [] };
}

function invalid(errors: ValidationError[]): ValidationResult {
  return { valid: false, errors };
}

function err(code: string, message: string, path?: string): ValidationError {
  return { code, message, path };
}

// ═══════════════════════════════════════════════════════════════
// Causal Graph Validator
// ═══════════════════════════════════════════════════════════════

/**
 * Represents a causal graph for validation purposes.
 * This is the unbranded structural type — the validator
 * must prove it meets all invariants before branding.
 */
export interface CausalGraphCandidate {
  nodes: CausalNodeCandidate[];
  edges: CausalEdgeCandidate[];
}

export interface CausalNodeCandidate {
  id: string;
  causalDepth: number;
  parentEventIds: string[];
  branch?: string;
}

export interface CausalEdgeCandidate {
  source: string;
  target: string;
  edgeType: "causal" | "temporal" | "branch";
}

/**
 * Validate a causal graph candidate against all invariants.
 *
 * Checks:
 * 1. No duplicate node IDs
 * 2. All edge endpoints reference existing nodes
 * 3. No self-loops
 * 4. Acyclicity (DAG property — THE fundamental invariant)
 * 5. Parent event existence (every parentEventId references a node)
 * 6. Causal depth consistency (depth = max(parentDepths) + 1)
 * 7. Genesis events have depth 0 and empty parentEventIds
 */
export function validateCausalGraph(candidate: CausalGraphCandidate): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. No duplicate node IDs
  const nodeIds = new Set<string>();
  for (const node of candidate.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(err("DUPLICATE_NODE", `Duplicate node ID: ${node.id}`, `nodes[${node.id}]`));
    }
    nodeIds.add(node.id);
  }

  // 2. All edge endpoints reference existing nodes
  for (const edge of candidate.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(err("MISSING_EDGE_SOURCE", `Edge source not found: ${edge.source}`, `edges[${edge.source}->${edge.target}]`));
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(err("MISSING_EDGE_TARGET", `Edge target not found: ${edge.target}`, `edges[${edge.source}->${edge.target}]`));
    }
  }

  // 3. No self-loops
  for (const edge of candidate.edges) {
    if (edge.source === edge.target) {
      errors.push(err("SELF_LOOP", `Self-loop detected: ${edge.source}`, `edges[${edge.source}]`));
    }
  }

  // 4. Acyclicity check via topological sort (Kahn's algorithm)
  const acyclicityResult = checkAcyclicity(candidate.nodes, candidate.edges);
  if (acyclicityResult.isDAG === false) {
    errors.push(err(
      "CYCLIC_GRAPH",
      `Graph contains cycles. Cycle involves: ${acyclicityResult.cycleNodes.join(" → ")}`,
      "graph"
    ));
  }


  // 5. Parent event existence
  for (const node of candidate.nodes) {
    for (const parentId of node.parentEventIds) {
      if (!nodeIds.has(parentId)) {
        errors.push(err(
          "MISSING_PARENT",
          `Node ${node.id} references non-existent parent: ${parentId}`,
          `nodes[${node.id}].parentEventIds`
        ));
      }
    }
  }

  // 6. Causal depth consistency
  const nodeMap = new Map(candidate.nodes.map((n) => [n.id, n]));
  for (const node of candidate.nodes) {
    if (node.parentEventIds.length === 0) {
      // Genesis events must have depth 0
      if (node.causalDepth !== 0) {
        errors.push(err(
          "INVALID_GENESIS_DEPTH",
          `Genesis node ${node.id} has depth ${node.causalDepth}, expected 0`,
          `nodes[${node.id}].causalDepth`
        ));
      }
    } else {
      // Non-genesis events: depth must be max(parentDepths) + 1
      const parentDepths = node.parentEventIds
        .map((pid) => nodeMap.get(pid))
        .filter((p): p is CausalNodeCandidate => p !== undefined)
        .map((p) => p.causalDepth);

      if (parentDepths.length > 0) {
        const expectedDepth = Math.max(...parentDepths) + 1;
        if (node.causalDepth !== expectedDepth) {
          errors.push(err(
            "INCONSISTENT_DEPTH",
            `Node ${node.id} has depth ${node.causalDepth}, expected ${expectedDepth} (max parent depth + 1)`,
            `nodes[${node.id}].causalDepth`
          ));
        }
      }
    }
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Check if a graph is a valid DAG using Kahn's algorithm.
 * Returns the topological order if valid, or cycle information if not.
 */
export type AcyclicityResult =
  | { isDAG: true; topologicalOrder: string[] }
  | { isDAG: false; cycleNodes: string[] };

export function checkAcyclicity(
  nodes: CausalNodeCandidate[],
  edges: CausalEdgeCandidate[]
): AcyclicityResult {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  // Build adjacency list and in-degree counts
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Find all nodes with in-degree 0
  const queue: string[] = [];
  Array.from(inDegree.entries()).forEach(([id, degree]) => {
    if (degree === 0) queue.push(id);
  });

  const topologicalOrder: string[] = [];
  let visitedCount = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    topologicalOrder.push(current);
    visitedCount++;

    const neighbors = adjacency.get(current) ?? [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (visitedCount === nodes.length) {
    return { isDAG: true as const, topologicalOrder };
  }

  // Cycle detected — find the cycle nodes
  const cycleNodes = nodes
    .filter((n) => !topologicalOrder.includes(n.id))
    .map((n) => n.id);

  return { isDAG: false as const, cycleNodes };
}

// ═══════════════════════════════════════════════════════════════
// Event Validator
// ═══════════════════════════════════════════════════════════════

export type HermesEventTier = "MODEL" | "DECISION" | "EXECUTION" | "SYSTEM" | "TELEMETRY";

export interface HermesEventCandidate {
  eventId: string;
  eventType: HermesEventTier;
  parentEventIds: string[];
  causalDepth: number;
  payload: Record<string, unknown>;
  timestamp: number;
  contentHash: string;
  runId: string;
  agentId?: string;
}

/**
 * Validate a single HermesEvent candidate.
 *
 * Checks:
 * 1. Non-empty eventId
 * 2. Valid eventType (one of the 5 tiers)
 * 3. Genesis events (depth 0) must have empty parentEventIds
 * 4. Non-genesis events must have non-empty parentEventIds
 * 5. Causal depth > 0 for non-genesis events
 * 6. Valid timestamp (positive number)
 * 7. Non-empty contentHash
 * 8. Non-empty runId
 */
export function validateEvent(event: HermesEventCandidate): ValidationResult {
  const errors: ValidationError[] = [];

  if (!event.eventId || event.eventId.trim() === "") {
    errors.push(err("EMPTY_EVENT_ID", "Event ID must be non-empty", "eventId"));
  }

  const validTiers: HermesEventTier[] = ["MODEL", "DECISION", "EXECUTION", "SYSTEM", "TELEMETRY"];
  if (!validTiers.includes(event.eventType)) {
    errors.push(err(
      "INVALID_EVENT_TYPE",
      `Invalid event type: ${event.eventType}. Must be one of: ${validTiers.join(", ")}`,
      "eventType"
    ));
  }

  // Genesis event rules
  if (event.causalDepth === 0) {
    if (event.parentEventIds.length > 0) {
      errors.push(err(
        "GENESIS_WITH_PARENTS",
        "Genesis events (depth 0) must have empty parentEventIds",
        "parentEventIds"
      ));
    }
  } else {
    // Non-genesis event rules
    if (event.parentEventIds.length === 0) {
      errors.push(err(
        "ORPHAN_EVENT",
        `Non-genesis event (depth ${event.causalDepth}) must have non-empty parentEventIds`,
        "parentEventIds"
      ));
    }
    if (event.causalDepth < 0) {
      errors.push(err(
        "NEGATIVE_DEPTH",
        `Causal depth cannot be negative: ${event.causalDepth}`,
        "causalDepth"
      ));
    }
  }

  if (event.timestamp <= 0) {
    errors.push(err("INVALID_TIMESTAMP", "Timestamp must be a positive number", "timestamp"));
  }

  if (!event.contentHash || event.contentHash.trim() === "") {
    errors.push(err("EMPTY_CONTENT_HASH", "Content hash must be non-empty", "contentHash"));
  }

  if (!event.runId || event.runId.trim() === "") {
    errors.push(err("EMPTY_RUN_ID", "Run ID must be non-empty", "runId"));
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validate an event against its known event context (parent existence).
 * This requires the set of all existing event IDs in the run.
 */
export function validateEventInContext(
  event: HermesEventCandidate,
  existingEventIds: Set<string>
): ValidationResult {
  // First validate the event structurally
  const structuralResult = validateEvent(event);
  if (!structuralResult.valid) return structuralResult;

  const errors: ValidationError[] = [];

  // Check all parent IDs exist in the event log
  for (const parentId of event.parentEventIds) {
    if (!existingEventIds.has(parentId)) {
      errors.push(err(
        "MISSING_PARENT_EVENT",
        `Parent event not found in log: ${parentId}`,
        "parentEventIds"
      ));
    }
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

// ═══════════════════════════════════════════════════════════════
// Frontier State Validator
// ═══════════════════════════════════════════════════════════════

export interface FrontierStateCandidate {
  visited: Set<string>;
  frontier: Set<string>;
}

/**
 * Validate a frontier state candidate.
 *
 * Checks:
 * 1. Visited and frontier are disjoint (no node is both visited and in frontier)
 * 2. Every frontier node's parents are all in visited
 * 3. No frontier node is in visited
 */
export function validateFrontierState(
  state: FrontierStateCandidate,
  graph: CausalGraphCandidate
): ValidationResult {
  const errors: ValidationError[] = [];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  // 1. Visited and frontier must be disjoint
  Array.from(state.frontier).forEach((id) => {
    if (state.visited.has(id)) {
      errors.push(err(
        "FRONTIER_VISITED_OVERLAP",
        `Node ${id} is in both frontier and visited sets`,
        `frontier[${id}]`
      ));
    }
  });

  // 2. Every frontier node's parents must be in visited
  Array.from(state.frontier).forEach((id) => {
    const node = nodeMap.get(id);
    if (node) {
      for (const parentId of node.parentEventIds) {
        if (!state.visited.has(parentId)) {
          errors.push(err(
            "FRONTIER_PARENT_NOT_VISITED",
            `Frontier node ${id} has unvisited parent: ${parentId}`,
            `frontier[${id}].parentEventIds`
          ));
        }
      }
    }
  });

  // 3. All visited and frontier nodes must exist in the graph
  Array.from(state.visited).forEach((id) => {
    if (!nodeMap.has(id)) {
      errors.push(err("VISITED_NODE_MISSING", `Visited node not in graph: ${id}`, `visited[${id}]`));
    }
  });

  Array.from(state.frontier).forEach((id) => {
    if (!nodeMap.has(id)) {
      errors.push(err("FRONTIER_NODE_MISSING", `Frontier node not in graph: ${id}`, `frontier[${id}]`));
    }
  });

  return errors.length > 0 ? invalid(errors) : valid();
}

// ═══════════════════════════════════════════════════════════════
// Verified Graph Constructor
// ═══════════════════════════════════════════════════════════════

/**
 * Construct a VerifiedCausalGraph from a candidate.
 * This is one of ONLY two authorized paths to create a VerifiedCausalGraph:
 *   - This function (in @hermes/test-harness)
 *   - buildCausalGraph() in @hermes/causal-core-lock
 *
 * @throws ValidationError if validation fails
 */
export function verifyAndBrandCausalGraph(candidate: CausalGraphCandidate): VerifiedCausalGraph {
  const result = validateCausalGraph(candidate);
  if (!result.valid) {
    throw new Error(
      `Causal graph validation failed:\n${result.errors.map((e) => `  [${e.code}] ${e.message}`).join("\n")}`
    );
  }
  return sealVerifiedCausalGraph(candidate);
}

/**
 * Safe version that returns a result instead of throwing.
 */
export function tryVerifyCausalGraph(
  candidate: CausalGraphCandidate
): { ok: true; graph: VerifiedCausalGraph } | { ok: false; errors: ValidationError[] } {
  const result = validateCausalGraph(candidate);
  if (!result.valid) {
    return { ok: false, errors: result.errors };
  }
  return { ok: true, graph: sealVerifiedCausalGraph(candidate) };
}
