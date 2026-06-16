/**
 * @hermes/hqa — Types
 *
 * Hermes Query Algebra — a closed operator system that
 * mathematically guarantees UI queries cannot mutate kernel semantics.
 *
 * The HQA is partitioned into three layers:
 *
 * 1. STRUCTURAL OPERATORS: SELECT, TRACE, CUT
 *    - Navigate and filter the causal graph structure
 *    - No semantic interpretation — pure graph operations
 *
 * 2. SEMANTIC OPERATORS: FOLD, DIFF
 *    - Aggregate and compare over event streams
 *    - Produce derived values, never modify the log
 *
 * 3. COUNTERFACTUAL OPERATORS: SIMULATE
 *    - Speculative branch exploration
 *    - Never affects the real event log
 *
 * CLOSED SYSTEM GUARANTEE:
 * No HQA operator can modify the event log or kernel state.
 * Every operator produces a new query result or view without
 * side effects.
 */

import type { HermesEvent, HermesEventTier } from "../event-dsl/types";
import type { FrontierState } from "../frontier/types";

// ═══════════════════════════════════════════════════════════════
// Query Types
// ═══════════════════════════════════════════════════════════════

/**
 * All possible HQA query types.
 */
export type HQAQuery =
  | SelectQuery
  | TraceQuery
  | CutQuery
  | FoldQuery
  | DiffQuery
  | SimulateQuery;

/**
 * Query operator types.
 */
export const HQAOperator = {
  SELECT: "SELECT",
  TRACE: "TRACE",
  CUT: "CUT",
  FOLD: "FOLD",
  DIFF: "DIFF",
  SIMULATE: "SIMULATE",
} as const;

export type HQAOperator = typeof HQAOperator[keyof typeof HQAOperator];

// ═══════════════════════════════════════════════════════════════
// Structural Operators
// ═══════════════════════════════════════════════════════════════

/**
 * SELECT — filter events by predicate.
 * Returns a subset of events matching the criteria.
 */
export interface SelectQuery {
  operator: typeof HQAOperator.SELECT;
  /** Filter predicate */
  predicate: EventPredicate;
  /** Run ID to filter within */
  runId?: string;
}

/**
 * Predicate for filtering events.
 */
export type EventPredicate =
  | TierPredicate
  | DepthPredicate
  | AgentPredicate
  | BranchPredicate
  | TimeRangePredicate
  | AndPredicate
  | OrPredicate
  | NotPredicate;

export interface TierPredicate {
  type: "tier";
  tier: HermesEventTier;
}

export interface DepthPredicate {
  type: "depth";
  min?: number;
  max?: number;
}

export interface AgentPredicate {
  type: "agent";
  agentId: string;
}

export interface BranchPredicate {
  type: "branch";
  branch: string;
}

export interface TimeRangePredicate {
  type: "timeRange";
  from?: number;
  to?: number;
}

export interface AndPredicate {
  type: "and";
  predicates: EventPredicate[];
}

export interface OrPredicate {
  type: "or";
  predicates: EventPredicate[];
}

export interface NotPredicate {
  type: "not";
  predicate: EventPredicate;
}

/**
 * TRACE — get the causal ancestry chain for an event.
 * Returns all events from genesis to the specified event,
 * following the causal parent chain.
 */
export interface TraceQuery {
  operator: typeof HQAOperator.TRACE;
  /** The event to trace from */
  eventId: string;
  /** Direction of trace */
  direction: "ancestors" | "descendants";
  /** Maximum depth of trace */
  maxDepth?: number;
}

/**
 * CUT — get events at a specific causal depth.
 * Returns all events with the specified depth, optionally
 * filtered by branch.
 */
export interface CutQuery {
  operator: typeof HQAOperator.CUT;
  /** The depth to cut at */
  depth: number;
  /** Optional branch filter */
  branch?: string;
  /** Run ID */
  runId?: string;
}

// ═══════════════════════════════════════════════════════════════
// Semantic Operators
// ═══════════════════════════════════════════════════════════════

/**
 * FOLD — aggregate over an event stream.
 * Produces a single derived value from multiple events.
 */
export interface FoldQuery {
  operator: typeof HQAOperator.FOLD;
  /** The accumulator function */
  accumulator: FoldAccumulator;
  /** Initial value */
  initialValue: unknown;
  /** Events to fold over (filtered by predicate) */
  predicate?: EventPredicate;
  /** Run ID */
  runId?: string;
}

/**
 * Accumulator function for FOLD.
 */
export type FoldAccumulator =
  | "count"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "collect"
  | "first"
  | "last";

/**
 * DIFF — compute the state delta between two points.
 * Returns the difference between two event sets or states.
 */
export interface DiffQuery {
  operator: typeof HQAOperator.DIFF;
  /** The "before" point (event ID or depth) */
  before: DiffPoint;
  /** The "after" point (event ID or depth) */
  after: DiffPoint;
  /** Run ID */
  runId?: string;
}

export type DiffPoint =
  | { type: "eventId"; eventId: string }
  | { type: "depth"; depth: number }
  | { type: "timestamp"; timestamp: number };

// ═══════════════════════════════════════════════════════════════
// Counterfactual Operators
// ═══════════════════════════════════════════════════════════════

/**
 * SIMULATE — explore a speculative branch.
 * Creates a virtual fork of the event log and applies
 * alternative events. NEVER affects the real event log.
 */
export interface SimulateQuery {
  operator: typeof HQAOperator.SIMULATE;
  /** The fork point (event ID where the branch diverges) */
  forkPoint: string;
  /** Alternative events to apply after the fork */
  alternativeEvents: HermesEvent[];
  /** Run ID */
  runId?: string;
}

// ═══════════════════════════════════════════════════════════════
// Query Result
// ═══════════════════════════════════════════════════════════════

/**
 * Result of executing an HQA query.
 */
export type HQAResult =
  | EventListResult
  | TraceResult
  | CutResult
  | FoldResult
  | DiffResult
  | SimulateResult;

export interface EventListResult {
  type: "eventList";
  events: HermesEvent[];
  count: number;
}

export interface TraceResult {
  type: "trace";
  events: HermesEvent[];
  depth: number;
  direction: "ancestors" | "descendants";
}

export interface CutResult {
  type: "cut";
  events: HermesEvent[];
  depth: number;
}

export interface FoldResult {
  type: "fold";
  value: unknown;
  accumulator: FoldAccumulator;
}

export interface DiffResult {
  type: "diff";
  added: HermesEvent[];
  removed: HermesEvent[];
  unchanged: HermesEvent[];
}

export interface SimulateResult {
  type: "simulate";
  originalEvents: HermesEvent[];
  simulatedEvents: HermesEvent[];
  forkPoint: string;
  divergedAt: number;
}
