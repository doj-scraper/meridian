/**
 * @hermes/causal-core-lock — CCL Types
 *
 * The Causal Core Lock is the type-system firewall of the Hermes
 * architecture. It provides:
 *
 * 1. VerifiedCausalGraph — a branded type that can ONLY be constructed
 *    through this package or @hermes/test-harness
 *
 * 2. CausalGraph — the structural representation of events and their
 *    causal relationships
 *
 * 3. Topological validation and ordering
 *
 * THE CENTRAL INVARIANT:
 * Any function that accepts a VerifiedCausalGraph is guaranteed to
 * receive a valid, acyclic, causally-consistent graph. This is
 * enforced at the TYPE level — construction is impossible outside
 * the authorized packages.
 */

import type {
  BrandedEventId,
  VerifiedCausalGraph,
  VerifiedTopologicalOrder,
} from "../test-harness/brands";
import type { HermesEvent, CausalEdge } from "../event-dsl/types";

// ═══════════════════════════════════════════════════════════════
// Causal Graph Structure
// ═══════════════════════════════════════════════════════════════

/**
 * A CausalGraph — the unverified structural representation.
 * Must pass through the CCL to become a VerifiedCausalGraph.
 */
export interface CausalGraph {
  /** All events in the graph, indexed by eventId */
  readonly events: ReadonlyMap<string, HermesEvent>;
  /** Causal edges between events */
  readonly edges: readonly CausalEdge[];
  /** The genesis event ID (there must be exactly one per run) */
  readonly genesisEventId: BrandedEventId;
  /** Maximum causal depth in the graph */
  readonly maxDepth: number;
  /** Total number of events */
  readonly eventCount: number;
  /** Branch labels present in the graph */
  readonly branches: ReadonlySet<string>;
  /** Run ID for this graph */
  readonly runId: string;
}

/**
 * A topological ordering of events in a causal graph.
 * Events are ordered such that every event appears after
 * all of its causal ancestors.
 */
export interface TopologicalOrdering {
  /** Events in topological order (ancestors before descendants) */
  readonly orderedEventIds: readonly string[];
  /** Mapping from eventId to its topological rank */
  readonly rankMap: ReadonlyMap<string, number>;
  /** Total number of events in the ordering */
  readonly totalEvents: number;
}

/**
 * Result of graph construction from events.
 */
export interface GraphConstructionResult {
  /** The verified causal graph */
  readonly graph: VerifiedCausalGraph;
  /** The topological ordering (also verified) */
  readonly topologicalOrder: VerifiedTopologicalOrder;
  /** Any warnings during construction */
  readonly warnings: GraphConstructionWarning[];
}

export interface GraphConstructionWarning {
  code: string;
  message: string;
  eventId?: string;
}

// ═══════════════════════════════════════════════════════════════
// Event Depth Context
// ═══════════════════════════════════════════════════════════════

/**
 * Context needed to derive causal depth for a new event.
 * Provides the depths of parent events for depth computation.
 */
export interface EventDepthContext {
  /** Map of eventId → causalDepth for all existing events */
  readonly depthMap: ReadonlyMap<string, number>;
}

/**
 * Computed depth for a new event based on its parents.
 */
export interface ComputedDepth {
  /** The derived causal depth */
  readonly causalDepth: number;
  /** The parent depths that were used for computation */
  readonly parentDepths: readonly number[];
}

// ═══════════════════════════════════════════════════════════════
// Graph Integrity Report
// ═══════════════════════════════════════════════════════════════

/**
 * Comprehensive integrity report for a VerifiedCausalGraph.
 * Used for debugging and verification of graph invariants.
 */
export interface GraphIntegrityReport {
  /** Whether the graph passes all integrity checks */
  readonly isValid: boolean;
  /** Total events in graph */
  readonly totalEvents: number;
  /** Total edges in graph */
  readonly totalEdges: number;
  /** Maximum causal depth */
  readonly maxDepth: number;
  /** Number of branches */
  readonly branchCount: number;
  /** Number of genesis events (must be exactly 1) */
  readonly genesisCount: number;
  /** Number of orphan events (non-genesis with no parents in graph) */
  readonly orphanCount: number;
  /** Whether the graph is a valid DAG */
  readonly isAcyclic: boolean;
  /** Events by tier */
  readonly eventsByTier: Readonly<Record<string, number>>;
  /** Depth distribution: depth → count */
  readonly depthDistribution: ReadonlyMap<number, number>;
  /** Any integrity violations found */
  readonly violations: readonly IntegrityViolation[];
}

export interface IntegrityViolation {
  code: string;
  message: string;
  eventId?: string;
  severity: "error" | "warning";
}
