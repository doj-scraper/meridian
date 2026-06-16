/**
 * @hermes/hqa — Hermes Query Algebra
 *
 * A closed operator system that mathematically guarantees
 * UI queries cannot mutate kernel semantics.
 *
 * Three operator layers:
 * 1. STRUCTURAL: SELECT, TRACE, CUT — navigate and filter
 * 2. SEMANTIC: FOLD, DIFF — aggregate and compare
 * 3. COUNTERFACTUAL: SIMULATE — speculative exploration
 *
 * PACKAGE DEPENDENCY LAW:
 * Depends on: @hermes/test-harness, @hermes/event-dsl, @hermes/frontier
 * Forbidden reverse: frontier must NOT import from hqa
 */

// ── Types ──
export {
  // Query types
  type HQAQuery,
  type HQAOperator as HQAOperatorType,
  HQAOperator,

  // Structural operator types
  type SelectQuery,
  type TraceQuery,
  type CutQuery,
  type EventPredicate,
  type TierPredicate,
  type DepthPredicate,
  type AgentPredicate,
  type BranchPredicate,
  type TimeRangePredicate,
  type AndPredicate,
  type OrPredicate,
  type NotPredicate,

  // Semantic operator types
  type FoldQuery,
  type FoldAccumulator,
  type DiffQuery,
  type DiffPoint,

  // Counterfactual operator types
  type SimulateQuery,

  // Result types
  type HQAResult,
  type EventListResult,
  type TraceResult,
  type CutResult,
  type FoldResult,
  type DiffResult,
  type SimulateResult,
} from "./types";

// ── Structural Operators ──
export {
  evaluatePredicate,
  selectEvents,
  traceAncestors,
  traceDescendants,
  cutAtDepth,
} from "./structural";

// ── Semantic Operators ──
export {
  foldEvents,
  diffEvents,
} from "./semantic";

// ── Counterfactual Operators ──
export {
  simulateBranch,
  compareSimulation,
  computeSimulatedFrontier,
} from "./counterfactual";

// ── Executor ──
export {
  executeQuery,
} from "./executor";

// ── Builder ──
export {
  HQAQueryBuilder,
  query,
  run,
} from "./builder";
