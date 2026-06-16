/**
 * @hermes/hqa — Counterfactual Operators
 *
 * SIMULATE — explore speculative branches.
 * Creates a virtual fork of the event log and applies alternative
 * events. NEVER affects the real event log.
 */

import type { HermesEvent } from "../event-dsl/types";
import { extractFrontierGraph, computeFrontier } from "../frontier/compute-frontier";

// ═══════════════════════════════════════════════════════════════
// SIMULATE — Speculative Branch Exploration
// ═══════════════════════════════════════════════════════════════

/**
 * Simulate a speculative branch by forking at a point and
 * applying alternative events.
 *
 * This NEVER affects the real event log — it operates on
 * a virtual copy and returns the simulated result.
 */
export function simulateBranch(
  originalEvents: HermesEvent[],
  forkPoint: string,
  alternativeEvents: HermesEvent[]
): {
  originalEvents: HermesEvent[];
  simulatedEvents: HermesEvent[];
  forkPoint: string;
  divergedAt: number;
} {
  // Find the fork point in the original events
  const forkIndex = originalEvents.findIndex(
    (e) => String(e.eventId) === forkPoint
  );

  if (forkIndex < 0) {
    // Fork point not found — return empty simulation
    return {
      originalEvents,
      simulatedEvents: [],
      forkPoint,
      divergedAt: -1,
    };
  }

  // Keep events before the fork point
  const eventsBeforeFork = originalEvents.slice(0, forkIndex + 1);

  // Build simulated event log: original up to fork + alternatives
  const simulatedEvents = [...eventsBeforeFork, ...alternativeEvents];

  return {
    originalEvents,
    simulatedEvents,
    forkPoint,
    divergedAt: forkIndex + 1,
  };
}

/**
 * Compare the original and simulated event logs.
 * Returns a structural comparison.
 */
export function compareSimulation(
  original: HermesEvent[],
  simulated: HermesEvent[]
): {
  commonPrefix: HermesEvent[];
  originalDivergence: HermesEvent[];
  simulatedDivergence: HermesEvent[];
  originalDepth: number;
  simulatedDepth: number;
} {
  // Find the common prefix
  let commonEnd = 0;
  const minLength = Math.min(original.length, simulated.length);

  for (let i = 0; i < minLength; i++) {
    if (String(original[i].eventId) === String(simulated[i].eventId)) {
      commonEnd = i + 1;
    } else {
      break;
    }
  }

  const commonPrefix = original.slice(0, commonEnd);
  const originalDivergence = original.slice(commonEnd);
  const simulatedDivergence = simulated.slice(commonEnd);

  const originalDepth = original.length > 0
    ? Math.max(...original.map((e) => e.causalDepth))
    : 0;
  const simulatedDepth = simulated.length > 0
    ? Math.max(...simulated.map((e) => e.causalDepth))
    : 0;

  return {
    commonPrefix,
    originalDivergence,
    simulatedDivergence,
    originalDepth,
    simulatedDepth,
  };
}

/**
 * Compute the frontier for a simulated branch.
 * Useful for understanding what would happen next
 * in the counterfactual timeline.
 */
export function computeSimulatedFrontier(
  simulatedEvents: HermesEvent[]
): Set<string> {
  if (simulatedEvents.length === 0) return new Set();

  // All events are "visited" in the simulation
  const visited = new Set(simulatedEvents.map((e) => String(e.eventId)));
  const graph = extractFrontierGraph(simulatedEvents);

  // Compute frontier from the full visited set
  return computeFrontier(graph, visited);
}
