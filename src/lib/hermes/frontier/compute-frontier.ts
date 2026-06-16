/**
 * @hermes/frontier — Core Frontier Computation
 *
 * computeFrontier() is the ONLY legal answer to "what happens next?"
 * in the Hermes architecture.
 *
 * This is NOT a queue. It is a constraint satisfaction surface over a DAG.
 * You do NOT "pop next event". You recompute a frontier set at every step.
 *
 * Formal definition:
 * A node n is in the frontier if:
 *   ∀ parent ∈ Parents(n): parent ∈ Visited
 *   AND n ∉ Visited
 *   AND n.branch ∈ activeBranchSet (if branch constraints exist)
 *
 * Tie-breaking: SHA-256(canonical(event)) — deterministic,
 * never affects frontier MEMBERSHIP, only execution ORDER.
 */

import type {
  FrontierGraph,
  FrontierState,
  PrioritizedFrontier,
  FrontierOptions,
  FrontierComputationResult,
  AdvanceResult,
  NodeId,
  PriorityFunction,
} from "./types";
import { PriorityStrategy } from "./types";
import { computeTieBreakHash } from "../event-dsl/hashing";
import type { HermesEvent } from "../event-dsl/types";

// ═══════════════════════════════════════════════════════════════
// Graph Extraction
// ═══════════════════════════════════════════════════════════════

/**
 * Extract a FrontierGraph from a list of HermesEvents.
 * This builds the adjacency structures needed for frontier computation.
 */
export function extractFrontierGraph(events: HermesEvent[]): FrontierGraph {
  const nodes = new Set<NodeId>();
  const children = new Map<NodeId, Set<NodeId>>();
  const parents = new Map<NodeId, Set<NodeId>>();
  const branches = new Map<NodeId, string>();
  const depths = new Map<NodeId, number>();

  for (const event of events) {
    const nodeId = String(event.eventId);
    nodes.add(nodeId);

    // Initialize adjacency entries
    if (!children.has(nodeId)) {
      children.set(nodeId, new Set());
    }
    if (!parents.has(nodeId)) {
      parents.set(nodeId, new Set());
    }

    // Track depth
    depths.set(nodeId, event.causalDepth);

    // Track branch
    if (event.branch) {
      branches.set(nodeId, event.branch);
    }

    // Build parent-child relationships
    for (const parentId of event.parentEventIds) {
      const pid = String(parentId);
      parents.get(nodeId)!.add(pid);

      if (!children.has(pid)) {
        children.set(pid, new Set());
      }
      children.get(pid)!.add(nodeId);
    }
  }

  return { nodes, children, parents, branches, depths };
}

// ═══════════════════════════════════════════════════════════════
// Core Algorithm: computeFrontier
// ═══════════════════════════════════════════════════════════════

/**
 * Compute the causal frontier of a DAG.
 *
 * THE central algorithm of the Hermes architecture.
 * This function determines which events are currently executable.
 *
 * @param graph - The causal graph
 * @param visited - Set of already-visited node IDs
 * @param activeBranches - Set of active branch labels (optional)
 * @returns The frontier set of currently executable node IDs
 */
export function computeFrontier(
  graph: FrontierGraph,
  visited: Set<NodeId>,
  activeBranches?: Set<string>
): Set<NodeId> {
  const frontier = new Set<NodeId>();

  for (const nodeId of graph.nodes) {
    // Skip visited nodes
    if (visited.has(nodeId)) continue;

    // Check branch constraint
    if (activeBranches && activeBranches.size > 0) {
      const nodeBranch = graph.branches.get(nodeId);
      if (nodeBranch && !activeBranches.has(nodeBranch)) {
        continue; // Node is on an inactive branch
      }
    }

    // Check all parents are visited
    const nodeParents = graph.parents.get(nodeId);
    if (!nodeParents || nodeParents.size === 0) {
      // Genesis node — always in frontier if not visited
      frontier.add(nodeId);
      continue;
    }

    let allParentsVisited = true;
    for (const parentId of nodeParents) {
      if (!visited.has(parentId)) {
        allParentsVisited = false;
        break;
      }
    }

    if (allParentsVisited) {
      frontier.add(nodeId);
    }
  }

  return frontier;
}

/**
 * Compute the initial frontier state for a graph.
 * No nodes are visited yet; frontier contains all root nodes.
 */
export function computeInitialFrontier(
  graph: FrontierGraph,
  options?: FrontierOptions
): FrontierComputationResult {
  const visited = new Set<NodeId>();
  const activeBranches = options?.activeBranches ?? new Set<string>();

  const frontier = computeFrontier(graph, visited, activeBranches);

  const state: FrontierState = {
    visited,
    frontier,
    activeBranches,
  };

  const prioritized = prioritizeFrontier(
    graph,
    state,
    frontier,
    options
  );

  return { state, prioritized };
}

/**
 * Compute a full frontier from a list of events and visited set.
 * Convenience function that combines extraction and computation.
 */
export function computeFrontierFromEvents(
  events: HermesEvent[],
  visited: Set<NodeId>,
  activeBranches?: Set<string>
): Set<NodeId> {
  const graph = extractFrontierGraph(events);
  return computeFrontier(graph, visited, activeBranches);
}

// ═══════════════════════════════════════════════════════════════
// Frontier Advance
// ═══════════════════════════════════════════════════════════════

/**
 * Advance the frontier by marking a node as visited.
 *
 * This is how the frontier "moves forward" — by visiting a node
 * from the frontier, its children may become eligible.
 *
 * IMPORTANT: This does NOT "pop" from the frontier. It recomputes
 * the frontier after adding the node to visited.
 *
 * @param graph - The causal graph
 * @param state - Current frontier state
 * @param nodeId - The node to visit
 * @returns The new frontier state after visiting the node
 */
export function advanceFrontier(
  graph: FrontierGraph,
  state: FrontierState,
  nodeId: NodeId
): AdvanceResult {
  // Validate: node must be in frontier
  if (!state.frontier.has(nodeId)) {
    throw new Error(
      `Cannot advance frontier: node ${nodeId} is not in the frontier. ` +
      `Frontier: {${Array.from(state.frontier).join(", ")}}`
    );
  }

  // Create new state (immutable update)
  const newVisited = new Set(state.visited);
  newVisited.add(nodeId);

  // Recompute frontier
  const newFrontier = computeFrontier(graph, newVisited, state.activeBranches);

  // Find newly added nodes
  const newlyAdded = new Set<NodeId>();
  for (const id of newFrontier) {
    if (!state.frontier.has(id) || id === nodeId) {
      // Skip the visited node itself
      if (id !== nodeId && !state.visited.has(id)) {
        newlyAdded.add(id);
      }
    }
  }

  const newState: FrontierState = {
    visited: newVisited,
    frontier: newFrontier,
    activeBranches: state.activeBranches,
  };

  return {
    state: newState,
    newlyAddedToFrontier: newlyAdded,
    isExhausted: newFrontier.size === 0,
  };
}

/**
 * Advance the frontier by visiting multiple nodes simultaneously.
 * Used for parallel execution of independent frontier events.
 */
export function advanceFrontierBatch(
  graph: FrontierGraph,
  state: FrontierState,
  nodeIds: NodeId[]
): AdvanceResult {
  // Validate all nodes are in frontier
  for (const nodeId of nodeIds) {
    if (!state.frontier.has(nodeId)) {
      throw new Error(
        `Cannot advance frontier: node ${nodeId} is not in the frontier.`
      );
    }
  }

  // Visit all nodes
  const newVisited = new Set(state.visited);
  for (const nodeId of nodeIds) {
    newVisited.add(nodeId);
  }

  // Recompute frontier
  const newFrontier = computeFrontier(graph, newVisited, state.activeBranches);

  // Find newly added nodes
  const newlyAdded = new Set<NodeId>();
  for (const id of newFrontier) {
    if (!state.frontier.has(id)) {
      newlyAdded.add(id);
    }
  }

  const newState: FrontierState = {
    visited: newVisited,
    frontier: newFrontier,
    activeBranches: state.activeBranches,
  };

  return {
    state: newState,
    newlyAddedToFrontier: newlyAdded,
    isExhausted: newFrontier.size === 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// Frontier Prioritization
// ═══════════════════════════════════════════════════════════════

/**
 * Prioritize the frontier for deterministic execution ordering.
 *
 * Priority determines EXECUTION ORDER, not MEMBERSHIP.
 * Tie-breaking by SHA-256 hash ensures deterministic ordering
 * that never affects which events are in the frontier.
 */
export function prioritizeFrontier(
  graph: FrontierGraph,
  state: FrontierState,
  frontier: Set<NodeId>,
  options?: FrontierOptions
): PrioritizedFrontier {
  const strategy = options?.priorityStrategy ?? PriorityStrategy.SHALLOW_FIRST;
  const customFn = options?.customPriorityFn;

  // Compute priority scores
  const priorities = new Map<NodeId, number>();
  const tieBreakHashes = new Map<NodeId, string>();

  for (const nodeId of frontier) {
    const priority = customFn
      ? customFn(nodeId, graph, state)
      : getDefaultPriority(nodeId, graph, state, strategy);

    priorities.set(nodeId, priority);
    tieBreakHashes.set(nodeId, computeTieBreakHashForNode(nodeId, graph));
  }

  // Sort by priority (descending) then by tie-break hash (ascending)
  const orderedFrontier = Array.from(frontier).sort((a, b) => {
    const priorityA = priorities.get(a) ?? 0;
    const priorityB = priorities.get(b) ?? 0;

    // Primary sort: priority (higher = first)
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    // Tie-break: SHA-256 hash (deterministic)
    const hashA = tieBreakHashes.get(a) ?? "";
    const hashB = tieBreakHashes.get(b) ?? "";
    return hashA.localeCompare(hashB);
  });

  // Apply max frontier size if specified
  const maxFrontierSize = options?.maxFrontierSize;
  const finalOrder = maxFrontierSize
    ? orderedFrontier.slice(0, maxFrontierSize)
    : orderedFrontier;

  return {
    frontier,
    orderedFrontier: finalOrder,
    priorities,
    tieBreakHashes,
  };
}

/**
 * Get the default priority for a node based on the strategy.
 */
function getDefaultPriority(
  nodeId: NodeId,
  graph: FrontierGraph,
  _state: FrontierState,
  strategy: PriorityStrategy
): number {
  switch (strategy) {
    case PriorityStrategy.SHALLOW_FIRST:
      // Negate depth so shallower = higher priority
      return -(graph.depths.get(nodeId) ?? 0);

    case PriorityStrategy.DEEP_FIRST:
      // Deeper = higher priority
      return graph.depths.get(nodeId) ?? 0;

    case PriorityStrategy.LINEAR_FIRST:
      // Fewer children = higher priority
      return -(graph.children.get(nodeId)?.size ?? 0);

    case PriorityStrategy.HASH_ONLY:
      // No priority — pure hash ordering
      return 0;

    default:
      return 0;
  }
}

/**
 * Compute a tie-breaking hash for a node.
 * Uses a deterministic representation of the node's identity.
 */
function computeTieBreakHashForNode(nodeId: NodeId, graph: FrontierGraph): string {
  // Create a deterministic representation for hashing
  const parentIds = Array.from(graph.parents.get(nodeId) ?? []).sort();
  const depth = graph.depths.get(nodeId) ?? 0;
  const branch = graph.branches.get(nodeId) ?? "";
  const canonical = JSON.stringify({ nodeId, depth, branch, parents: parentIds });
  return computeTieBreakHash({ id: nodeId, depth, branch, parents: parentIds } as unknown as Record<string, unknown>);
}
