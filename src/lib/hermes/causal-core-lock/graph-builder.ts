/**
 * @hermes/causal-core-lock — Graph Builder
 *
 * Constructs a VerifiedCausalGraph from a sequence of HermesEvents.
 * This is one of ONLY two authorized paths to create a VerifiedCausalGraph:
 *   - @hermes/test-harness (graph generators)
 *   - This module (graph builder)
 *
 * Construction Process:
 * 1. Collect all events into an indexed map
 * 2. Derive causal edges from parentEventIds
 * 3. Compute topological ordering via Kahn's algorithm
 * 4. Assign topologicalRank to each event
 * 5. Validate all invariants (acyclicity, depth consistency, etc.)
 * 6. Seal with VerifiedCausalGraph brand
 */

import {
  sealVerifiedCausalGraph,
  sealVerifiedTopologicalOrder,
  type VerifiedCausalGraph,
  type VerifiedTopologicalOrder,
  type BrandedEventId,
} from "../test-harness/brands";
import { checkAcyclicity } from "../test-harness/validators";
import type { HermesEvent, CausalEdge } from "../event-dsl/types";
import type {
  CausalGraph,
  TopologicalOrdering,
  GraphConstructionResult,
  GraphConstructionWarning,
  ComputedDepth,
  EventDepthContext,
  GraphIntegrityReport,
  IntegrityViolation,
} from "./types";

// ═══════════════════════════════════════════════════════════════
// Graph Construction
// ═══════════════════════════════════════════════════════════════

/**
 * Build a VerifiedCausalGraph from a sequence of HermesEvents.
 *
 * AUTHORIZED CONSTRUCTION PATH — this function is one of only two
 * ways to create a VerifiedCausalGraph (the other being the
 * test-harness graph generators).
 *
 * @param events - Ordered sequence of HermesEvents (order doesn't matter —
 *                 topological order is derived from causal structure)
 * @returns GraphConstructionResult with verified graph and topological order
 * @throws Error if graph invariants are violated
 */
export function buildCausalGraph(events: HermesEvent[]): GraphConstructionResult {
  const warnings: GraphConstructionWarning[] = [];
  const violations: IntegrityViolation[] = [];

  // 1. Index events by ID
  const eventMap = new Map<string, HermesEvent>();
  for (const event of events) {
    const id = String(event.eventId);
    if (eventMap.has(id)) {
      violations.push({
        code: "DUPLICATE_EVENT",
        message: `Duplicate event ID: ${id}`,
        eventId: id,
        severity: "error",
      });
    }
    eventMap.set(id, event);
  }

  // 2. Derive causal edges from parentEventIds
  const edges: CausalEdge[] = [];
  for (const event of events) {
    for (const parentId of event.parentEventIds) {
      const parentStr = String(parentId);
      if (!eventMap.has(parentStr)) {
        violations.push({
          code: "MISSING_PARENT",
          message: `Event ${String(event.eventId)} references non-existent parent ${parentStr}`,
          eventId: String(event.eventId),
          severity: "error",
        });
        continue;
      }
      edges.push({
        source: parentId as BrandedEventId,
        target: event.eventId,
        edgeType: "causal",
      });
    }
  }

  // 3. Find genesis event
  const genesisEvents = events.filter(
    (e) => e.causalDepth === 0 && e.parentEventIds.length === 0
  );

  if (genesisEvents.length === 0) {
    violations.push({
      code: "NO_GENESIS",
      message: "Graph has no genesis event",
      severity: "error",
    });
  } else if (genesisEvents.length > 1) {
    warnings.push({
      code: "MULTIPLE_GENESIS",
      message: `Graph has ${genesisEvents.length} genesis events; expected 1`,
    });
  }

  const genesisEventId = genesisEvents[0]?.eventId as BrandedEventId | undefined;

  // 4. Validate depth consistency
  for (const event of events) {
    if (event.parentEventIds.length > 0) {
      const parentDepths = event.parentEventIds
        .map((pid) => eventMap.get(String(pid)))
        .filter((e): e is HermesEvent => e !== undefined)
        .map((e) => e.causalDepth);

      if (parentDepths.length > 0) {
        const expectedDepth = Math.max(...parentDepths) + 1;
        if (event.causalDepth !== expectedDepth) {
          violations.push({
            code: "INCONSISTENT_DEPTH",
            message: `Event ${String(event.eventId)} has depth ${event.causalDepth}, expected ${expectedDepth}`,
            eventId: String(event.eventId),
            severity: "warning",
          });
        }
      }
    }
  }

  // 5. Check acyclicity
  const nodeCandidates = events.map((e) => ({
    id: String(e.eventId),
    causalDepth: e.causalDepth,
    parentEventIds: e.parentEventIds.map(String),
  }));

  const edgeCandidates = edges.map((e) => ({
    source: String(e.source),
    target: String(e.target),
    edgeType: e.edgeType,
  }));

  const acyclicityResult = checkAcyclicity(nodeCandidates, edgeCandidates);
  if (acyclicityResult.isDAG === false) {
    violations.push({
      code: "CYCLIC_GRAPH",
      message: `Graph contains cycles involving: ${acyclicityResult.cycleNodes.join(" → ")}`,
      severity: "error",
    });
  }

  // 6. Fail if any error-level violations
  const errorViolations = violations.filter((v) => v.severity === "error");
  if (errorViolations.length > 0) {
    throw new Error(
      `Causal graph construction failed:\n${errorViolations.map((v) => `  [${v.code}] ${v.message}`).join("\n")}`
    );
  }

  // 7. Compute max depth
  const maxDepth = events.length > 0
    ? Math.max(...events.map((e) => e.causalDepth))
    : 0;

  // 8. Collect branches
  const branches = new Set<string>();
  for (const event of events) {
    if (event.branch) branches.add(event.branch);
  }

  // 9. Build CausalGraph
  const runId = events[0]?.runId ? String(events[0].runId) : "";

  const causalGraph: CausalGraph = {
    events: eventMap,
    edges,
    genesisEventId: genesisEventId ?? ("" as BrandedEventId),
    maxDepth,
    eventCount: events.length,
    branches,
    runId,
  };

  // 10. Compute topological order (already done by Kahn's algorithm)
  const topologicalOrder = acyclicityResult.isDAG === true
    ? buildTopologicalOrdering(events, acyclicityResult.topologicalOrder)
    : buildTopologicalOrdering(events, events.map((e) => String(e.eventId)));

  // 11. Seal with brands
  const verifiedGraph = sealVerifiedCausalGraph(causalGraph);
  const verifiedOrder = sealVerifiedTopologicalOrder(topologicalOrder);

  return {
    graph: verifiedGraph,
    topologicalOrder: verifiedOrder,
    warnings,
  };
}

/**
 * Build a TopologicalOrdering from a topological sort result.
 */
function buildTopologicalOrdering(
  events: HermesEvent[],
  orderedIds: string[]
): TopologicalOrdering {
  const rankMap = new Map<string, number>();
  for (let i = 0; i < orderedIds.length; i++) {
    rankMap.set(orderedIds[i], i);
  }

  return {
    orderedEventIds: orderedIds,
    rankMap,
    totalEvents: events.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// Incremental Graph Extension
// ═══════════════════════════════════════════════════════════════

/**
 * Extend a verified causal graph with a new event.
 * Returns a new verified graph — the original is never mutated.
 *
 * This is the primary way the graph grows during execution:
 * each new event is appended, the graph is re-verified, and
 * a new VerifiedCausalGraph is produced.
 */
export function extendCausalGraph(
  existingGraph: CausalGraph,
  newEvent: HermesEvent
): GraphConstructionResult {
  // Collect all existing events plus the new one
  const existingEvents = Array.from(existingGraph.events.values());
  const allEvents = [...existingEvents, newEvent];

  // Rebuild and re-verify the entire graph
  // This is correct but not maximally efficient — optimization
  // would use incremental topological sort
  return buildCausalGraph(allEvents);
}

// ═══════════════════════════════════════════════════════════════
// Depth Computation
// ═══════════════════════════════════════════════════════════════

/**
 * Compute the causal depth for a new event given its parent events.
 * The depth is max(parentDepths) + 1.
 */
export function computeCausalDepth(
  parentEventIds: readonly string[],
  depthContext: EventDepthContext
): ComputedDepth {
  if (parentEventIds.length === 0) {
    return { causalDepth: 0, parentDepths: [] };
  }

  const parentDepths = parentEventIds.map((id) => {
    const depth = depthContext.depthMap.get(id);
    if (depth === undefined) {
      throw new Error(`Cannot compute depth: parent event ${id} not found in depth context`);
    }
    return depth;
  });

  return {
    causalDepth: Math.max(...parentDepths) + 1,
    parentDepths,
  };
}

/**
 * Build a depth context from an existing causal graph.
 * Maps every event ID to its causal depth.
 */
export function buildDepthContext(graph: CausalGraph): EventDepthContext {
  const depthMap = new Map<string, number>();
  Array.from(graph.events.entries()).forEach(([id, event]) => {
    depthMap.set(id, event.causalDepth);
  });
  return { depthMap };
}

// ═══════════════════════════════════════════════════════════════
// Integrity Verification
// ═══════════════════════════════════════════════════════════════

/**
 * Perform a comprehensive integrity check on a VerifiedCausalGraph.
 * Returns a detailed report of all graph properties and any violations.
 */
export function verifyGraphIntegrity(graph: CausalGraph): GraphIntegrityReport {
  const events = Array.from(graph.events.values());
  const violations: IntegrityViolation[] = [];

  // Events by tier
  const eventsByTier: Record<string, number> = {};
  for (const event of events) {
    const tier = String(event.eventType);
    eventsByTier[tier] = (eventsByTier[tier] || 0) + 1;
  }

  // Depth distribution
  const depthDistribution = new Map<number, number>();
  for (const event of events) {
    const count = depthDistribution.get(event.causalDepth) || 0;
    depthDistribution.set(event.causalDepth, count + 1);
  }

  // Genesis count
  const genesisEvents = events.filter(
    (e) => e.causalDepth === 0 && e.parentEventIds.length === 0
  );

  // Orphan count
  const eventIds = new Set(events.map((e) => String(e.eventId)));
  const orphans = events.filter(
    (e) => e.causalDepth > 0 && e.parentEventIds.some((pid) => !eventIds.has(String(pid)))
  );

  if (orphans.length > 0) {
    violations.push({
      code: "ORPHAN_EVENTS",
      message: `Found ${orphans.length} events with missing parents`,
      severity: "error",
    });
  }

  // Acyclicity check
  const nodeCandidates = events.map((e) => ({
    id: String(e.eventId),
    causalDepth: e.causalDepth,
    parentEventIds: e.parentEventIds.map(String),
  }));

  const edgeCandidates = graph.edges.map((e) => ({
    source: String(e.source),
    target: String(e.target),
    edgeType: e.edgeType,
  }));

  const acyclicityResult = checkAcyclicity(nodeCandidates, edgeCandidates);
  const isAcyclic = acyclicityResult.isDAG === true;

  if (!isAcyclic) {
    violations.push({
      code: "CYCLIC_GRAPH",
      message: "Graph contains cycles",
      severity: "error",
    });
  }

  return {
    isValid: violations.filter((v) => v.severity === "error").length === 0,
    totalEvents: events.length,
    totalEdges: graph.edges.length,
    maxDepth: graph.maxDepth,
    branchCount: graph.branches.size,
    genesisCount: genesisEvents.length,
    orphanCount: orphans.length,
    isAcyclic,
    eventsByTier,
    depthDistribution,
    violations,
  };
}
