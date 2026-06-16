/**
 * @hermes/ui-topology — Event Stream Projection
 *
 * Projects HermesEvents into UI-friendly event stream entries.
 * Used by the timeline/run view to display event history.
 */

import type { HermesEvent, HermesEventTier } from "../event-dsl/types";
import type { EventStreamEntry } from "./types";
import type { FrontierState } from "../frontier/types";

/**
 * Project a list of HermesEvents into EventStreamEntry objects.
 * This is a PURE PROJECTION — no mutation of kernel state.
 */
export function projectToEventStream(
  events: HermesEvent[],
  frontierState: FrontierState | null
): EventStreamEntry[] {
  return events.map((event) => projectSingleEvent(event, frontierState));
}

/**
 * Project a single HermesEvent into an EventStreamEntry.
 */
function projectSingleEvent(
  event: HermesEvent,
  frontierState: FrontierState | null
): EventStreamEntry {
  const eventId = String(event.eventId);
  const payload = event.payload as Record<string, unknown>;

  return {
    id: eventId,
    tier: event.eventType,
    label: getStreamLabel(event),
    depth: event.causalDepth,
    agentName: event.agentId ? String(event.agentId) : undefined,
    timestamp: event.timestamp,
    summary: getStreamSummary(event),
    isFrontier: frontierState?.frontier.has(eventId) ?? false,
    branch: event.branch,
    parentIds: event.parentEventIds.map(String),
  };
}

function getStreamLabel(event: HermesEvent): string {
  const payload = event.payload as Record<string, unknown>;
  switch (event.eventType) {
    case "MODEL":
      return `Model Call (${(payload as { modelId?: string }).modelId ?? "unknown"})`;
    case "DECISION":
      return `Decision: ${(payload as { decision?: string }).decision ?? "unknown"}`;
    case "EXECUTION":
      return `Execute ${(payload as { tool?: string }).tool ?? "tool"}`;
    case "SYSTEM":
      return `System: ${(payload as { subtype?: string }).subtype ?? "event"}`;
    case "TELEMETRY":
      return `Metric: ${(payload as { metric?: string }).metric ?? "unknown"}`;
    default:
      return "Unknown Event";
  }
}

function getStreamSummary(event: HermesEvent): string {
  const payload = event.payload as Record<string, unknown>;
  switch (event.eventType) {
    case "MODEL": {
      const resp = (payload as { response?: string }).response ?? "";
      return resp.length > 100 ? resp.substring(0, 100) + "..." : resp;
    }
    case "DECISION":
      return (payload as { reasoning?: string }).reasoning ?? "No reasoning provided";
    case "EXECUTION": {
      const output = (payload as { output?: string }).output ?? "";
      return output.length > 100 ? output.substring(0, 100) + "..." : output;
    }
    case "SYSTEM":
      return (payload as { message?: string }).message ?? "";
    case "TELEMETRY":
      return `${(payload as { metric?: string }).metric ?? "metric"} = ${(payload as { value?: number }).value ?? 0}`;
    default:
      return "";
  }
}
