/**
 * @hermes/hqa — Semantic Operators
 *
 * FOLD, DIFF — aggregate and compare over event streams.
 * Produce derived values, never modify the event log.
 */

import type { HermesEvent } from "../event-dsl/types";
import type { FoldAccumulator, DiffPoint, EventPredicate } from "./types";
import { evaluatePredicate, selectEvents } from "./structural";

// ═══════════════════════════════════════════════════════════════
// FOLD — Aggregate Over Event Stream
// ═══════════════════════════════════════════════════════════════

/**
 * Apply a FOLD accumulator over a set of events.
 * Produces a single derived value.
 */
export function foldEvents(
  events: HermesEvent[],
  accumulator: FoldAccumulator,
  initialValue: unknown,
  predicate?: EventPredicate
): unknown {
  // Filter events if predicate provided
  const filtered = predicate
    ? selectEvents(events, predicate)
    : events;

  switch (accumulator) {
    case "count":
      return filtered.length;

    case "sum": {
      const field = initialValue as string ?? "tokenCount";
      return filtered.reduce((sum, event) => {
        const payload = event.payload as Record<string, unknown>;
        const value = Number(payload[field]) || 0;
        return sum + value;
      }, 0);
    }

    case "avg": {
      if (filtered.length === 0) return 0;
      const field = initialValue as string ?? "tokenCount";
      const total = filtered.reduce((sum, event) => {
        const payload = event.payload as Record<string, unknown>;
        const value = Number(payload[field]) || 0;
        return sum + value;
      }, 0);
      return total / filtered.length;
    }

    case "min": {
      if (filtered.length === 0) return null;
      const field = initialValue as string ?? "latencyMs";
      return Math.min(...filtered.map((event) => {
        const payload = event.payload as Record<string, unknown>;
        return Number(payload[field]) || 0;
      }));
    }

    case "max": {
      if (filtered.length === 0) return null;
      const field = initialValue as string ?? "latencyMs";
      return Math.max(...filtered.map((event) => {
        const payload = event.payload as Record<string, unknown>;
        return Number(payload[field]) || 0;
      }));
    }

    case "collect":
      return filtered.map((e) => e.payload);

    case "first":
      return filtered.length > 0 ? filtered[0] : null;

    case "last":
      return filtered.length > 0 ? filtered[filtered.length - 1] : null;

    default:
      return initialValue;
  }
}

// ═══════════════════════════════════════════════════════════════
// DIFF — State Delta Between Two Points
// ═══════════════════════════════════════════════════════════════

/**
 * Compute the diff between two points in the event log.
 * Returns added, removed, and unchanged events.
 */
export function diffEvents(
  events: HermesEvent[],
  before: DiffPoint,
  after: DiffPoint
): {
  added: HermesEvent[];
  removed: HermesEvent[];
  unchanged: HermesEvent[];
} {
  const beforeEvents = getEventsAtPoint(events, before);
  const afterEvents = getEventsAtPoint(events, after);

  const beforeIds = new Set(beforeEvents.map((e) => String(e.eventId)));
  const afterIds = new Set(afterEvents.map((e) => String(e.eventId)));

  const added = afterEvents.filter((e) => !beforeIds.has(String(e.eventId)));
  const removed = beforeEvents.filter((e) => !afterIds.has(String(e.eventId)));
  const unchanged = beforeEvents.filter((e) => afterIds.has(String(e.eventId)));

  return { added, removed, unchanged };
}

/**
 * Get events at a specific point in the event log.
 */
function getEventsAtPoint(events: HermesEvent[], point: DiffPoint): HermesEvent[] {
  switch (point.type) {
    case "eventId": {
      // All events up to and including the specified event
      const eventIndex = events.findIndex(
        (e) => String(e.eventId) === point.eventId
      );
      return eventIndex >= 0 ? events.slice(0, eventIndex + 1) : [];
    }

    case "depth":
      // All events up to and including the specified depth
      return events.filter((e) => e.causalDepth <= point.depth);

    case "timestamp":
      // All events up to and including the specified timestamp
      return events.filter((e) => e.timestamp <= point.timestamp);

    default:
      return [];
  }
}
