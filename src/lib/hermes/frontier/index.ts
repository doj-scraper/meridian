/**
 * @hermes/frontier — Causal Frontier Solver
 *
 * computeFrontier() is the ONLY legal answer to "what happens next?"
 * in the Hermes architecture.
 *
 * This is NOT a queue. It is a constraint satisfaction surface over a DAG.
 *
 * PACKAGE DEPENDENCY LAW:
 * Depends on: @hermes/test-harness, @hermes/event-dsl
 * Forbidden reverse: event-dsl must NOT import from frontier
 */

// ── Types ──
export {
  type NodeId,
  type FrontierGraph,
  type FrontierState,
  type PrioritizedFrontier,
  type PriorityFunction,
  type PriorityStrategy as PriorityStrategyType,
  PriorityStrategy,
  type FrontierOptions,
  type AdvanceResult,
  type FrontierComputationResult,
} from "./types";

// ── Core Algorithm ──
export {
  extractFrontierGraph,
  computeFrontier,
  computeInitialFrontier,
  computeFrontierFromEvents,
  advanceFrontier,
  advanceFrontierBatch,
  prioritizeFrontier,
} from "./compute-frontier";
