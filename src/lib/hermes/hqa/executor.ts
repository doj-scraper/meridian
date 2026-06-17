/**
 * @hermes/hqa — Query Executor
 *
 * Executes HQA queries against an event log.
 * The executor is a pure function: same query + same log = same result.
 * No side effects — the event log is never modified.
 */

import type { HermesEvent } from "../event-dsl/types";
import type {
  HQAQuery,
  HQAResult,
  EventListResult,
  TraceResult,
  CutResult,
  FoldResult,
  DiffResult,
  SimulateResult,
} from "./types";
import { HQAOperator } from "./types";
import { selectEvents, traceAncestors, traceDescendants, cutAtDepth } from "./structural";
import { foldEvents, diffEvents } from "./semantic";
import { simulateBranch } from "./counterfactual";

// ═══════════════════════════════════════════════════════════════
// Executor
// ═══════════════════════════════════════════════════════════════

/**
 * Execute an HQA query against an event log.
 *
 * This is the main entry point for HQA queries.
 * The executor dispatches to the appropriate operator
 * based on the query type.
 *
 * @param query - The HQA query to execute
 * @param events - The complete event log to query against
 * @returns The query result
 */
export function executeQuery(
  query: HQAQuery,
  events: HermesEvent[]
): HQAResult {
  // Filter by runId if specified
  const filteredEvents = filterByRunId(events, getRunId(query));

  switch (query.operator) {
    case HQAOperator.SELECT:
      return executeSelect(query, filteredEvents);
    case HQAOperator.TRACE:
      return executeTrace(query, filteredEvents);
    case HQAOperator.CUT:
      return executeCut(query, filteredEvents);
    case HQAOperator.FOLD:
      return executeFold(query, filteredEvents);
    case HQAOperator.DIFF:
      return executeDiff(query, filteredEvents);
    case HQAOperator.SIMULATE:
      return executeSimulate(query, filteredEvents);
    default:
      throw new Error(`Unknown HQA operator: ${String((query as any).operator)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// Operator Execution
// ═══════════════════════════════════════════════════════════════

function executeSelect(
  query: { predicate: Parameters<typeof selectEvents>[1] },
  events: HermesEvent[]
): EventListResult {
  const selected = selectEvents(events, query.predicate);
  return {
    type: "eventList",
    events: selected,
    count: selected.length,
  };
}

function executeTrace(
  query: { eventId: string; direction: "ancestors" | "descendants"; maxDepth?: number },
  events: HermesEvent[]
): TraceResult {
  const traced = query.direction === "ancestors"
    ? traceAncestors(events, query.eventId, query.maxDepth)
    : traceDescendants(events, query.eventId, query.maxDepth);

  return {
    type: "trace",
    events: traced,
    depth: traced.length > 0 ? Math.max(...traced.map((e) => e.causalDepth)) : 0,
    direction: query.direction,
  };
}

function executeCut(
  query: { depth: number; branch?: string },
  events: HermesEvent[]
): CutResult {
  const cut = cutAtDepth(events, query.depth, query.branch);
  return {
    type: "cut",
    events: cut,
    depth: query.depth,
  };
}

function executeFold(
  query: { accumulator: Parameters<typeof foldEvents>[1]; initialValue: unknown; predicate?: Parameters<typeof foldEvents>[3] },
  events: HermesEvent[]
): FoldResult {
  const value = foldEvents(events, query.accumulator, query.initialValue, query.predicate);
  return {
    type: "fold",
    value,
    accumulator: query.accumulator,
  };
}

function executeDiff(
  query: { before: Parameters<typeof diffEvents>[1]; after: Parameters<typeof diffEvents>[2] },
  events: HermesEvent[]
): DiffResult {
  const result = diffEvents(events, query.before, query.after);
  return {
    type: "diff",
    ...result,
  };
}

function executeSimulate(
  query: { forkPoint: string; alternativeEvents: HermesEvent[] },
  events: HermesEvent[]
): SimulateResult {
  const result = simulateBranch(events, query.forkPoint, query.alternativeEvents);
  return {
    type: "simulate",
    ...result,
  };
}

// ═══════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════

function getRunId(query: HQAQuery): string | undefined {
  return ("runId" in query ? query.runId : undefined) as string | undefined;
}

function filterByRunId(events: HermesEvent[], runId?: string): HermesEvent[] {
  if (!runId) return events;
  return events.filter((e) => String(e.runId) === runId);
}
