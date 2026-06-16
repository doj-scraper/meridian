/**
 * @hermes/causal-core-lock — Topological Sort
 *
 * Deterministic topological ordering of events in a causal graph.
 * The topological sort provides:
 *
 * 1. A total order consistent with the partial order of causality
 * 2. topologicalRank for each event (used by frontier solver)
 * 3. Depth distribution for visualization
 *
 * DETERMINISM GUARANTEE:
 * When multiple valid orderings exist (events at the same depth
 * with no causal relationship), the tie-breaking is deterministic:
 * events are ordered by SHA-256(canonical(event)) hash.
 * This tie-breaking NEVER affects frontier membership — it only
 * determines the order of events that are simultaneously executable.
 */

import type { HermesEvent } from "../event-dsl/types";
import { computeTieBreakHash } from "../event-dsl/hashing";

// ═══════════════════════════════════════════════════════════════
// Topological Sort with Deterministic Tie-Breaking
// ═══════════════════════════════════════════════════════════════

/**
 * Perform a deterministic topological sort of HermesEvents.
 *
 * Uses Kahn's algorithm with deterministic tie-breaking:
 * when multiple events have in-degree 0 (simultaneously at
 * the frontier), they are ordered by their SHA-256 hash.
 *
 * @param events - Events to sort (order of input doesn't matter)
 * @returns Event IDs in topological order
 */
export function topologicalSort(events: HermesEvent[]): string[] {
  if (events.length === 0) return [];

  // Build event index
  const eventMap = new Map(events.map((e) => [String(e.eventId), e]));

  // Build adjacency list and in-degree map
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const event of events) {
    const id = String(event.eventId);
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const event of events) {
    const targetId = String(event.eventId);
    for (const parentId of event.parentEventIds) {
      const sourceId = String(parentId);
      if (adjacency.has(sourceId)) {
        adjacency.get(sourceId)!.push(targetId);
        inDegree.set(targetId, (inDegree.get(targetId) ?? 0) + 1);
      }
    }
  }

  // Find all events with in-degree 0
  const zeroDegree: string[] = [];
  for (const [id, degree] of Array.from(inDegree.entries())) {
    if (degree === 0) zeroDegree.push(id);
  }

  // Sort by tie-breaking hash for determinism
  zeroDegree.sort((a, b) => {
    const hashA = computeTieBreakHash(eventMap.get(a)! as unknown as Record<string, unknown>);
    const hashB = computeTieBreakHash(eventMap.get(b)! as unknown as Record<string, unknown>);
    return hashA.localeCompare(hashB);
  });

  const result: string[] = [];

  // Kahn's algorithm with sorted queue
  const queue = [...zeroDegree];
  while (queue.length > 0) {
    // Pop the first event (deterministic due to sorting)
    const current = queue.shift()!;
    result.push(current);

    // Get neighbors
    const neighbors = adjacency.get(current) ?? [];

    // Decrease in-degree and add to queue if zero
    const newZeroDegree: string[] = [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        newZeroDegree.push(neighbor);
      }
    }

    // Sort new zero-degree events by hash for determinism
    newZeroDegree.sort((a, b) => {
      const hashA = computeTieBreakHash(eventMap.get(a)! as unknown as Record<string, unknown>);
      const hashB = computeTieBreakHash(eventMap.get(b)! as unknown as Record<string, unknown>);
      return hashA.localeCompare(hashB);
    });

    // Insert in sorted order (merge with existing queue)
    for (const id of newZeroDegree) {
      insertSorted(queue, id, eventMap);
    }
  }

  return result;
}

/**
 * Insert an event ID into a sorted queue, maintaining order by tie-break hash.
 */
function insertSorted(
  queue: string[],
  id: string,
  eventMap: Map<string, HermesEvent>
): void {
  const hash = computeTieBreakHash(eventMap.get(id)! as unknown as Record<string, unknown>);

  let i = 0;
  while (i < queue.length) {
    const existingHash = computeTieBreakHash(eventMap.get(queue[i])! as unknown as Record<string, unknown>);
    if (hash.localeCompare(existingHash) <= 0) break;
    i++;
  }

  queue.splice(i, 0, id);
}

// ═══════════════════════════════════════════════════════════════
// Rank Assignment
// ═══════════════════════════════════════════════════════════════

/**
 * Assign topological ranks to events based on the sorted order.
 * Returns a map of eventId → topologicalRank.
 */
export function assignTopologicalRanks(
  events: HermesEvent[],
  sortedIds: string[]
): Map<string, number> {
  const rankMap = new Map<string, number>();
  for (let i = 0; i < sortedIds.length; i++) {
    rankMap.set(sortedIds[i], i);
  }
  return rankMap;
}

/**
 * Group events by their causal depth.
 * Returns a map of depth → events at that depth.
 */
export function groupByDepth(events: HermesEvent[]): Map<number, HermesEvent[]> {
  const groups = new Map<number, HermesEvent[]>();
  for (const event of events) {
    const depth = event.causalDepth;
    if (!groups.has(depth)) {
      groups.set(depth, []);
    }
    groups.get(depth)!.push(event);
  }
  return groups;
}

/**
 * Get the width (max events at any depth) of the causal graph.
 * This is useful for understanding parallelism potential.
 */
export function computeGraphWidth(events: HermesEvent[]): number {
  const groups = groupByDepth(events);
  let maxWidth = 0;
  for (const depthEvents of Array.from(groups.values())) {
    maxWidth = Math.max(maxWidth, depthEvents.length);
  }
  return maxWidth;
}

/**
 * Compute the critical path length (longest causal chain) in the graph.
 * This is equal to maxDepth + 1 (genesis at depth 0).
 */
export function computeCriticalPathLength(events: HermesEvent[]): number {
  if (events.length === 0) return 0;
  return Math.max(...events.map((e) => e.causalDepth)) + 1;
}
