/**
 * @hermes/frontier — Types
 *
 * The Causal Frontier Solver is the ONLY legal answer to
 * "what happens next" in the Hermes architecture.
 *
 * The frontier is NOT a queue. It is a constraint satisfaction
 * surface over a DAG. You do NOT "pop next event". You recompute
 * a frontier set at every step.
 *
 * Formal definition:
 * A node n is in the frontier if:
 *   ∀ parent ∈ Parents(n): parent ∈ Visited
 *   AND n ∉ Visited
 *   AND n.branch ∈ activeBranchSet (if branch constraints exist)
 */

import type { VerifiedCausalGraph, VerifiedFrontierState } from "../test-harness/brands";
import type { HermesEvent, CausalEdge } from "../event-dsl/types";

// ═══════════════════════════════════════════════════════════════
// Node ID Type
// ═══════════════════════════════════════════════════════════════

export type NodeId = string;

// ═══════════════════════════════════════════════════════════════
// Causal Graph (Frontier View)
// ═══════════════════════════════════════════════════════════════

/**
 * A causal graph as viewed by the frontier solver.
 * This is a simplified representation extracted from the
 * VerifiedCausalGraph, containing only the information
 * needed for frontier computation.
 */
export interface FrontierGraph {
  /** All node IDs in the graph */
  nodes: Set<NodeId>;
  /** Adjacency list: parentId → childIds */
  children: Map<NodeId, Set<NodeId>>;
  /** Reverse adjacency list: childId → parentIds */
  parents: Map<NodeId, Set<NodeId>>;
  /** Branch assignment: nodeId → branch label */
  branches: Map<NodeId, string>;
  /** Causal depth: nodeId → depth */
  depths: Map<NodeId, number>;
}

// ═══════════════════════════════════════════════════════════════
// Frontier State
// ═══════════════════════════════════════════════════════════════

/**
 * The frontier state — the output of computeFrontier().
 *
 * The frontier is the set of nodes that are currently executable:
 * all their parents have been visited, they haven't been visited
 * themselves, and they belong to an active branch.
 */
export interface FrontierState {
  /** Nodes that have been executed/visited */
  visited: Set<NodeId>;
  /** Nodes currently in the frontier (executable next) */
  frontier: Set<NodeId>;
  /** Active branch labels */
  activeBranches: Set<string>;
}

/**
 * A prioritized frontier with deterministic ordering.
 * The frontier set determines MEMBERSHIP. The priority order
 * determines EXECUTION ORDER within the frontier.
 */
export interface PrioritizedFrontier {
  /** The frontier set (membership) */
  frontier: Set<NodeId>;
  /** The frontier in priority order (execution order) */
  orderedFrontier: NodeId[];
  /** Priority scores: nodeId → priority */
  priorities: Map<NodeId, number>;
  /** Tie-breaking hashes for deterministic ordering */
  tieBreakHashes: Map<NodeId, string>;
}

// ═══════════════════════════════════════════════════════════════
// Priority Configuration
// ═══════════════════════════════════════════════════════════════

/**
 * Priority function for frontier ordering.
 * Higher values = higher priority = executed first.
 */
export type PriorityFunction = (
  nodeId: NodeId,
  graph: FrontierGraph,
  state: FrontierState
) => number;

/**
 * Built-in priority strategies.
 */
export const PriorityStrategy = {
  /** Execute shallower events first (BFS-like) */
  SHALLOW_FIRST: "SHALLOW_FIRST" as const,
  /** Execute deeper events first (DFS-like) */
  DEEP_FIRST: "DEEP_FIRST" as const,
  /** Execute events with fewer children first (reduce fan-out) */
  LINEAR_FIRST: "LINEAR_FIRST" as const,
  /** No priority — pure tie-breaking by hash */
  HASH_ONLY: "HASH_ONLY" as const,
};

export type PriorityStrategy = typeof PriorityStrategy[keyof typeof PriorityStrategy];

// ═══════════════════════════════════════════════════════════════
// Frontier Computation Options
// ═══════════════════════════════════════════════════════════════

export interface FrontierOptions {
  /** Priority strategy for ordering the frontier */
  priorityStrategy?: PriorityStrategy;
  /** Custom priority function (overrides strategy) */
  customPriorityFn?: PriorityFunction;
  /** Active branches (null = all branches active) */
  activeBranches?: Set<string>;
  /** Maximum frontier size (for bounded parallelism) */
  maxFrontierSize?: number;
}

// ═══════════════════════════════════════════════════════════════
// Advance Result
// ═══════════════════════════════════════════════════════════════

/**
 * Result of advancing the frontier by executing a node.
 */
export interface AdvanceResult {
  /** The updated frontier state */
  state: FrontierState;
  /** Newly added frontier nodes (made executable by this advance) */
  newlyAddedToFrontier: Set<NodeId>;
  /** Whether the frontier is empty (no more executable nodes) */
  isExhausted: boolean;
}

/**
 * Result of computing the initial frontier.
 */
export interface FrontierComputationResult {
  /** The frontier state */
  state: FrontierState;
  /** The prioritized frontier */
  prioritized: PrioritizedFrontier;
}
