/**
 * @hermes/hqa — Structural Operators
 *
 * SELECT, TRACE, CUT — navigate and filter the causal graph.
 * Pure graph operations with no semantic interpretation.
 */

import type { HermesEvent, HermesEventTier } from "../event-dsl/types";
import type {
  EventPredicate,
  TierPredicate,
  DepthPredicate,
  AgentPredicate,
  BranchPredicate,
  TimeRangePredicate,
  AndPredicate,
  OrPredicate,
  NotPredicate,
} from "./types";

// ═══════════════════════════════════════════════════════════════
// SELECT — Filter Events by Predicate
// ═══════════════════════════════════════════════════════════════

/**
 * Evaluate an EventPredicate against a HermesEvent.
 * Pure function — no side effects.
 */
export function evaluatePredicate(
  event: HermesEvent,
  predicate: EventPredicate
): boolean {
  switch (predicate.type) {
    case "tier":
      return evaluateTierPredicate(event, predicate);
    case "depth":
      return evaluateDepthPredicate(event, predicate);
    case "agent":
      return evaluateAgentPredicate(event, predicate);
    case "branch":
      return evaluateBranchPredicate(event, predicate);
    case "timeRange":
      return evaluateTimeRangePredicate(event, predicate);
    case "and":
      return evaluateAndPredicate(event, predicate);
    case "or":
      return evaluateOrPredicate(event, predicate);
    case "not":
      return evaluateNotPredicate(event, predicate);
    default:
      return false;
  }
}

/**
 * Filter events by predicate.
 */
export function selectEvents(
  events: HermesEvent[],
  predicate: EventPredicate
): HermesEvent[] {
  return events.filter((event) => evaluatePredicate(event, predicate));
}

// ═══════════════════════════════════════════════════════════════
// Predicate Evaluators
// ═══════════════════════════════════════════════════════════════

function evaluateTierPredicate(event: HermesEvent, pred: TierPredicate): boolean {
  return event.eventType === pred.tier;
}

function evaluateDepthPredicate(event: HermesEvent, pred: DepthPredicate): boolean {
  if (pred.min !== undefined && event.causalDepth < pred.min) return false;
  if (pred.max !== undefined && event.causalDepth > pred.max) return false;
  return true;
}

function evaluateAgentPredicate(event: HermesEvent, pred: AgentPredicate): boolean {
  return event.agentId ? String(event.agentId) === pred.agentId : false;
}

function evaluateBranchPredicate(event: HermesEvent, pred: BranchPredicate): boolean {
  return event.branch === pred.branch;
}

function evaluateTimeRangePredicate(event: HermesEvent, pred: TimeRangePredicate): boolean {
  if (pred.from !== undefined && event.timestamp < pred.from) return false;
  if (pred.to !== undefined && event.timestamp > pred.to) return false;
  return true;
}

function evaluateAndPredicate(event: HermesEvent, pred: AndPredicate): boolean {
  return pred.predicates.every((p) => evaluatePredicate(event, p));
}

function evaluateOrPredicate(event: HermesEvent, pred: OrPredicate): boolean {
  return pred.predicates.some((p) => evaluatePredicate(event, p));
}

function evaluateNotPredicate(event: HermesEvent, pred: NotPredicate): boolean {
  return !evaluatePredicate(event, pred.predicate);
}

// ═══════════════════════════════════════════════════════════════
// TRACE — Causal Ancestry/Descendency
// ═══════════════════════════════════════════════════════════════

/**
 * Trace the causal ancestry of an event.
 * Returns all events from genesis to the specified event.
 */
export function traceAncestors(
  events: HermesEvent[],
  eventId: string,
  maxDepth?: number
): HermesEvent[] {
  const eventMap = new Map(events.map((e) => [String(e.eventId), e]));
  const result: HermesEvent[] = [];
  const visited = new Set<string>();

  function traceUp(id: string, depth: number): void {
    if (visited.has(id)) return;
    if (maxDepth !== undefined && depth > maxDepth) return;

    const event = eventMap.get(id);
    if (!event) return;

    visited.add(id);
    result.push(event);

    for (const parentId of event.parentEventIds) {
      traceUp(String(parentId), depth + 1);
    }
  }

  traceUp(eventId, 0);

  // Sort by causal depth (ascending)
  return result.sort((a, b) => a.causalDepth - b.causalDepth);
}

/**
 * Trace the causal descendants of an event.
 * Returns all events that causally depend on the specified event.
 */
export function traceDescendants(
  events: HermesEvent[],
  eventId: string,
  maxDepth?: number
): HermesEvent[] {
  const childrenMap = new Map<string, string[]>();

  // Build children map
  for (const event of events) {
    for (const parentId of event.parentEventIds) {
      const pid = String(parentId);
      if (!childrenMap.has(pid)) {
        childrenMap.set(pid, []);
      }
      childrenMap.get(pid)!.push(String(event.eventId));
    }
  }

  const eventMap = new Map(events.map((e) => [String(e.eventId), e]));
  const result: HermesEvent[] = [];
  const visited = new Set<string>();

  function traceDown(id: string, depth: number): void {
    if (visited.has(id)) return;
    if (maxDepth !== undefined && depth > maxDepth) return;

    const children = childrenMap.get(id) ?? [];
    for (const childId of children) {
      if (visited.has(childId)) continue;
      visited.add(childId);

      const childEvent = eventMap.get(childId);
      if (childEvent) {
        result.push(childEvent);
        traceDown(childId, depth + 1);
      }
    }
  }

  traceDown(eventId, 0);

  return result.sort((a, b) => a.causalDepth - b.causalDepth);
}

// ═══════════════════════════════════════════════════════════════
// CUT — Events at Specific Depth
// ═══════════════════════════════════════════════════════════════

/**
 * Get all events at a specific causal depth.
 */
export function cutAtDepth(
  events: HermesEvent[],
  depth: number,
  branch?: string
): HermesEvent[] {
  return events.filter((event) => {
    if (event.causalDepth !== depth) return false;
    if (branch && event.branch !== branch) return false;
    return true;
  });
}
