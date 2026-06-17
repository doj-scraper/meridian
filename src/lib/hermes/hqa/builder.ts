/**
 * @hermes/hqa — Query Builder
 *
 * Type-safe fluent query builder for HQA queries.
 * Provides a convenient API for constructing queries
 * without dealing with the raw query type structure.
 */

import type { HermesEvent, HermesEventTier } from "../event-dsl/types";
import type {
  HQAQuery,
  SelectQuery,
  TraceQuery,
  CutQuery,
  FoldQuery,
  DiffQuery,
  SimulateQuery,
  EventPredicate,
  FoldAccumulator,
  DiffPoint,
  HQAResult,
} from "./types";
import { HQAOperator } from "./types";
import { executeQuery } from "./executor";

// ═══════════════════════════════════════════════════════════════
// Query Builder
// ═══════════════════════════════════════════════════════════════

/**
 * Fluent query builder for HQA queries.
 */
export class HQAQueryBuilder {
  private runId?: string;

  forRun(runId: string): this {
    this.runId = runId;
    return this;
  }

  // ── Structural Operators ──

  select(predicate: EventPredicate): SelectQuery {
    return {
      operator: HQAOperator.SELECT,
      predicate,
      runId: this.runId,
    };
  }

  selectByTier(tier: HermesEventTier): SelectQuery {
    return this.select({ type: "tier", tier });
  }

  selectByDepth(min?: number, max?: number): SelectQuery {
    return this.select({ type: "depth", min, max });
  }

  selectByAgent(agentId: string): SelectQuery {
    return this.select({ type: "agent", agentId });
  }

  selectByBranch(branch: string): SelectQuery {
    return this.select({ type: "branch", branch });
  }

  selectByTimeRange(from?: number, to?: number): SelectQuery {
    return this.select({ type: "timeRange", from, to });
  }

  trace(eventId: string, direction: "ancestors" | "descendants" = "ancestors", maxDepth?: number): TraceQuery {
    return {
      operator: HQAOperator.TRACE,
      eventId,
      direction,
      maxDepth,
    };
  }

  cut(depth: number, branch?: string): CutQuery {
    return {
      operator: HQAOperator.CUT,
      depth,
      branch,
      runId: this.runId,
    };
  }

  // ── Semantic Operators ──

  fold(accumulator: FoldAccumulator, initialValue?: unknown, predicate?: EventPredicate): FoldQuery {
    return {
      operator: HQAOperator.FOLD,
      accumulator,
      initialValue,
      predicate,
      runId: this.runId,
    };
  }

  count(predicate?: EventPredicate): FoldQuery {
    return this.fold("count", undefined, predicate);
  }

  diff(before: DiffPoint, after: DiffPoint): DiffQuery {
    return {
      operator: HQAOperator.DIFF,
      before,
      after,
      runId: this.runId,
    };
  }

  // ── Counterfactual Operators ──

  simulate(forkPoint: string, alternativeEvents: HermesEvent[]): SimulateQuery {
    return {
      operator: HQAOperator.SIMULATE,
      forkPoint,
      alternativeEvents,
      runId: this.runId,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// Convenience Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new HQA query builder.
 */
export function query(): HQAQueryBuilder {
  return new HQAQueryBuilder();
}

/**
 * Execute an HQA query against an event log.
 * Convenience function that wraps executeQuery.
 */
export function run(query: HQAQuery, events: HermesEvent[]): HQAResult {
  return executeQuery(query, events);
}
