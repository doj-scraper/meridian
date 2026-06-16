/**
 * @hermes/test-harness — Property-Based Testing Infrastructure
 *
 * Defines the formal properties (invariants) that the Hermes causal
 * execution substrate must satisfy. These properties are:
 *
 * 1. Graph Invariants — properties that hold for ALL valid causal graphs
 * 2. Frontier Invariants — properties that hold for ALL frontier computations
 * 3. Reducer Invariants — properties that hold for ALL state reductions
 * 4. Event Invariants — properties that hold for ALL HermesEvents
 *
 * These properties serve as executable specifications — they can be
 * checked against any implementation to verify correctness.
 */

import type { CausalGraphCandidate, CausalNodeCandidate } from "./validators";
import { validateCausalGraph, checkAcyclicity } from "./validators";
import {
  linearChain,
  diamondDAG,
  wideFan,
  randomDAG,
  branchedDAG,
  complexDAG,
  SeededRNG,
} from "./generators";

// ═══════════════════════════════════════════════════════════════
// Property Check Result
// ═══════════════════════════════════════════════════════════════

export interface PropertyCheckResult {
  property: string;
  passed: boolean;
  counterexample?: string;
  details?: string;
}

function pass(property: string): PropertyCheckResult {
  return { property, passed: true };
}

function fail(property: string, counterexample: string, details?: string): PropertyCheckResult {
  return { property, passed: false, counterexample, details };
}

// ═══════════════════════════════════════════════════════════════
// Graph Invariants
// ═══════════════════════════════════════════════════════════════

/**
 * P1: Acyclicity — Every valid causal graph must be a DAG.
 * No sequence of causal edges may form a cycle.
 */
export function property_acyclicity(graph: CausalGraphCandidate): PropertyCheckResult {
  const result = checkAcyclicity(graph.nodes, graph.edges);
  if (result.isDAG === true) {
    return pass("P1: Acyclicity");
  }
  return fail(
    "P1: Acyclicity",
    `Cycle detected: ${result.cycleNodes.join(" → ")}`,
    `Graph has ${graph.nodes.length} nodes and ${graph.edges.length} edges`
  );
}

/**
 * P2: Causal Depth Monotonicity — For every causal edge (A → B),
 * B.causalDepth > A.causalDepth.
 * Events never depend on events at the same or greater depth.
 */
export function property_depthMonotonicity(graph: CausalGraphCandidate): PropertyCheckResult {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  for (const edge of graph.edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (source && target && target.causalDepth <= source.causalDepth) {
      return fail(
        "P2: Causal Depth Monotonicity",
        `Edge ${edge.source}(depth=${source.causalDepth}) → ${edge.target}(depth=${target.causalDepth})`,
        "Target depth must be greater than source depth"
      );
    }
  }

  return pass("P2: Causal Depth Monotonicity");
}

/**
 * P3: Genesis Uniqueness — A graph has exactly one genesis event
 * per run (depth 0, no parents). This is a domain constraint,
 * not a general DAG property.
 */
export function property_genesisUniqueness(graph: CausalGraphCandidate): PropertyCheckResult {
  const genesisEvents = graph.nodes.filter(
    (n) => n.causalDepth === 0 && n.parentEventIds.length === 0
  );

  if (genesisEvents.length === 1) {
    return pass("P3: Genesis Uniqueness");
  }
  return fail(
    "P3: Genesis Uniqueness",
    `Found ${genesisEvents.length} genesis events: ${genesisEvents.map((n) => n.id).join(", ")}`,
    "Expected exactly 1 genesis event"
  );
}

/**
 * P4: Parent Existence — Every parentEventId references an existing node.
 * No dangling references in the causal graph.
 */
export function property_parentExistence(graph: CausalGraphCandidate): PropertyCheckResult {
  const nodeIds = new Set(graph.nodes.map((n) => n.id));

  for (const node of graph.nodes) {
    for (const parentId of node.parentEventIds) {
      if (!nodeIds.has(parentId)) {
        return fail(
          "P4: Parent Existence",
          `Node ${node.id} references non-existent parent ${parentId}`,
          "All parentEventIds must reference existing nodes"
        );
      }
    }
  }

  return pass("P4: Parent Existence");
}

/**
 * P5: Depth Consistency — For every non-genesis node:
 * node.causalDepth === max(parent.causalDepth for parent in parents) + 1
 */
export function property_depthConsistency(graph: CausalGraphCandidate): PropertyCheckResult {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  for (const node of graph.nodes) {
    if (node.parentEventIds.length === 0) continue;

    const parentDepths = node.parentEventIds
      .map((pid) => nodeMap.get(pid))
      .filter((p): p is CausalNodeCandidate => p !== undefined)
      .map((p) => p.causalDepth);

    if (parentDepths.length === 0) continue;

    const expectedDepth = Math.max(...parentDepths) + 1;
    if (node.causalDepth !== expectedDepth) {
      return fail(
        "P5: Depth Consistency",
        `Node ${node.id} has depth ${node.causalDepth}, expected ${expectedDepth}`,
        `Parent depths: [${parentDepths.join(", ")}]`
      );
    }
  }

  return pass("P5: Depth Consistency");
}

/**
 * P6: No Orphan Events — Every non-genesis event has at least one parent.
 * There are no floating events disconnected from the causal chain.
 */
export function property_noOrphanEvents(graph: CausalGraphCandidate): PropertyCheckResult {
  for (const node of graph.nodes) {
    if (node.causalDepth > 0 && node.parentEventIds.length === 0) {
      return fail(
        "P6: No Orphan Events",
        `Node ${node.id} has depth ${node.causalDepth} but no parents`,
        "Non-genesis events must have at least one parent"
      );
    }
  }

  return pass("P6: No Orphan Events");
}

/**
 * P7: Edge-Parent Consistency — Every causal edge corresponds to
 * a parent-child relationship in the node's parentEventIds.
 */
export function property_edgeParentConsistency(graph: CausalGraphCandidate): PropertyCheckResult {
  for (const edge of graph.edges) {
    if (edge.edgeType !== "causal") continue;

    const target = graph.nodes.find((n) => n.id === edge.target);
    if (target && !target.parentEventIds.includes(edge.source)) {
      return fail(
        "P7: Edge-Parent Consistency",
        `Causal edge ${edge.source} → ${edge.target}, but ${edge.source} is not in ${edge.target}'s parentEventIds`,
        "Causal edges must correspond to parent relationships"
      );
    }
  }

  return pass("P7: Edge-Parent Consistency");
}

// ═══════════════════════════════════════════════════════════════
// Frontier Invariants
// ═══════════════════════════════════════════════════════════════

/**
 * P8: Frontier-Visited Disjoint — No node is simultaneously in
 * the frontier and visited sets.
 */
export function property_frontierVisitedDisjoint(
  visited: Set<string>,
  frontier: Set<string>
): PropertyCheckResult {
  for (const id of Array.from(frontier)) {
    if (visited.has(id)) {
      return fail(
        "P8: Frontier-Visited Disjoint",
        `Node ${id} is in both frontier and visited`,
        "Frontier and visited must be disjoint"
      );
    }
  }
  return pass("P8: Frontier-Visited Disjoint");
}

/**
 * P9: Frontier Parents All Visited — Every node in the frontier
 * has all its parents in the visited set.
 */
export function property_frontierParentsVisited(
  graph: CausalGraphCandidate,
  visited: Set<string>,
  frontier: Set<string>
): PropertyCheckResult {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  for (const id of Array.from(frontier)) {
    const node = nodeMap.get(id);
    if (!node) continue;

    for (const parentId of node.parentEventIds) {
      if (!visited.has(parentId)) {
        return fail(
          "P9: Frontier Parents All Visited",
          `Frontier node ${id} has unvisited parent ${parentId}`,
          "All parents of frontier nodes must be visited"
        );
      }
    }
  }

  return pass("P9: Frontier Parents All Visited");
}

/**
 * P10: Frontier Completeness — Every node that has all parents
 * visited and is not itself visited MUST be in the frontier.
 * The frontier is the maximal such set.
 */
export function property_frontierCompleteness(
  graph: CausalGraphCandidate,
  visited: Set<string>,
  frontier: Set<string>
): PropertyCheckResult {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  for (const node of graph.nodes) {
    if (visited.has(node.id)) continue;
    if (frontier.has(node.id)) continue;

    // This node is not visited and not in frontier — check if it SHOULD be
    const allParentsVisited = node.parentEventIds.every((pid) => visited.has(pid));
    if (allParentsVisited && node.parentEventIds.length > 0) {
      return fail(
        "P10: Frontier Completeness",
        `Node ${node.id} has all parents visited but is not in frontier`,
        "Frontier must contain ALL executable nodes"
      );
    }
  }

  return pass("P10: Frontier Completeness");
}

// ═══════════════════════════════════════════════════════════════
// Batch Property Checking
// ═══════════════════════════════════════════════════════════════

/**
 * Check all graph invariants against a single graph.
 */
export function checkAllGraphProperties(graph: CausalGraphCandidate): PropertyCheckResult[] {
  return [
    property_acyclicity(graph),
    property_depthMonotonicity(graph),
    property_genesisUniqueness(graph),
    property_parentExistence(graph),
    property_depthConsistency(graph),
    property_noOrphanEvents(graph),
    property_edgeParentConsistency(graph),
  ];
}

/**
 * Check all frontier invariants against a frontier computation result.
 */
export function checkAllFrontierProperties(
  graph: CausalGraphCandidate,
  visited: Set<string>,
  frontier: Set<string>
): PropertyCheckResult[] {
  return [
    property_frontierVisitedDisjoint(visited, frontier),
    property_frontierParentsVisited(graph, visited, frontier),
    property_frontierCompleteness(graph, visited, frontier),
  ];
}

/**
 * Run a comprehensive property check across all generator patterns.
 * This is the main entry point for regression testing.
 */
export function regressionTestAllGenerators(): {
  generator: string;
  results: PropertyCheckResult[];
  allPassed: boolean;
}[] {
  const generators: [string, () => CausalGraphCandidate][] = [
    ["linearChain(5)", () => linearChain(5)],
    ["linearChain(1)", () => linearChain(1)],
    ["diamondDAG(2,1)", () => diamondDAG(2, 1)],
    ["diamondDAG(3,2)", () => diamondDAG(3, 2)],
    ["wideFan(5)", () => wideFan(5)],
    ["wideFan(1)", () => wideFan(1)],
    ["branchedDAG(2,3)", () => branchedDAG(2, 3)],
    ["branchedDAG(4,2)", () => branchedDAG(4, 2)],
    ["complexDAG(2,3,2)", () => complexDAG(2, 3, 2)],
    ["randomDAG(20,5,3,42)", () => randomDAG(20, 5, 3, 42)],
    ["randomDAG(50,8,4,123)", () => randomDAG(50, 8, 4, 123)],
  ];

  return generators.map(([name, gen]) => {
    const graph = gen();
    const validation = validateCausalGraph(graph);
    const propertyResults = checkAllGraphProperties(graph);

    // Also check validation result
    if (!validation.valid) {
      propertyResults.push({
        property: "Structural Validation",
        passed: false,
        counterexample: validation.errors.map((e) => e.message).join("; "),
      });
    } else {
      propertyResults.push({ property: "Structural Validation", passed: true });
    }

    return {
      generator: name,
      results: propertyResults,
      allPassed: propertyResults.every((r) => r.passed),
    };
  });
}
