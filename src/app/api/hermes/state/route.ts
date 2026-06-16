/**
 * GET /api/hermes/state
 *
 * Get the current state of a Hermes run.
 * Returns projected causal graph, frontier, event stream, and agent states.
 */

import { NextRequest, NextResponse } from "next/server";
import { getKernel, getEventStore } from "@/lib/hermes/kernel-spine";
import { getRunState, getAgentState } from "@/lib/hermes/kernel-spine/reducer";
import { extractFrontierGraph, computeFrontier } from "@/lib/hermes/frontier/compute-frontier";
import { projectToReactFlow } from "@/lib/hermes/ui-topology/graph-renderer";
import { projectToEventStream } from "@/lib/hermes/ui-topology/event-projection";
import { projectAgentStates, getRoleColor } from "@/lib/hermes/ui-topology/agent-projection";
import { projectFrontierState } from "@/lib/hermes/ui-topology/frontier-viz";
import { createRunId } from "@/lib/hermes/event-dsl/constructors";
import type { HermesEvent } from "@/lib/hermes/event-dsl/types";

/**
 * Derive run status from events when the kernel context is not available.
 * Looks at the last SYSTEM event to determine terminal state.
 */
function deriveRunStatus(events: HermesEvent[]): string {
  if (events.length === 0) return "idle";

  // Check for terminal system events in reverse order
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.eventType === "SYSTEM") {
      const payload = event.payload as { subtype?: string };
      switch (payload.subtype) {
        case "run_complete":
          return "completed";
        case "run_error":
          return "failed";
        case "run_stopped":
          return "stopped";
      }
    }
  }

  // If we have events but no terminal state, the run is still going
  // (or the kernel is processing in a different context)
  return "running";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("runId");

    if (!runId) {
      return NextResponse.json(
        { error: "runId query parameter is required" },
        { status: 400 }
      );
    }

    const kernel = getKernel();
    const store = getEventStore();

    // Get kernel state
    const state = kernel.getState(createRunId(runId));
    const status = kernel.getStatus(createRunId(runId));

    // Get events for this run — always load from DB to get latest state.
    // The kernel may be running in a different context and adding events
    // that aren't in this request's in-memory store yet.
    const inMemoryCount = store.getByRunIdSync(runId).length;
    const loaded = await store.loadFromDb(runId);
    const events = store.getByRunIdSync(runId);

    // Compute frontier — derive visited/branches from events if kernel state unavailable
    const graph = extractFrontierGraph(events);
    const runState = state ? getRunState(state, runId) : null;

    // When kernel state is available, use its visited/branch sets.
    // Otherwise, derive from events (all events are "visited" since they've been emitted).
    let visited: Set<string>;
    let activeBranches: Set<string>;

    if (state) {
      visited = state.visited.get(runId) ?? new Set<string>();
      activeBranches = state.activeBranches.get(runId) ?? new Set<string>();
    } else {
      // Derive from events: all emitted event IDs are visited
      visited = new Set(events.map((e) => String(e.eventId)));
      activeBranches = new Set(
        events.filter((e) => e.branch).map((e) => e.branch!)
      );
    }

    const frontier = computeFrontier(graph, visited, activeBranches);

    const frontierState = {
      visited,
      frontier,
      activeBranches,
    };

    // Project to UI formats
    const { nodes, edges } = projectToReactFlow(events, frontierState);
    const eventStream = projectToEventStream(events, frontierState);
    const frontierView = projectFrontierState(frontierState);

    // Project agent states — derive from events if kernel state unavailable
    let agentViews: Array<Record<string, unknown>>;

    if (state) {
      agentViews = projectAgentStates(state.agents).map((a) => ({
        ...a,
        color: getRoleColor(a.role),
      }));
    } else {
      // Derive agent info from events
      const agentIds = new Set<string>();
      const agentData = new Map<string, { name: string; role: string; proposalCount: number; executionCount: number }>();

      for (const event of events) {
        if (event.agentId) {
          const aId = String(event.agentId);
          agentIds.add(aId);
          if (!agentData.has(aId)) {
            agentData.set(aId, { name: aId, role: "general", proposalCount: 0, executionCount: 0 });
          }
          const data = agentData.get(aId)!;
          if (event.eventType === "DECISION") data.proposalCount++;
          if (event.eventType === "EXECUTION") data.executionCount++;
        }
      }

      agentViews = Array.from(agentData.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        role: data.role,
        status: "idle" as const,
        proposalCount: data.proposalCount,
        executionCount: data.executionCount,
        color: getRoleColor(data.role),
        totalTokens: 0,
      }));
    }

    // Transform nodes to the store format
    const causalNodes = nodes.map((n) => ({
      id: n.id,
      tier: n.data.tier,
      label: n.data.label,
      depth: n.data.depth,
      agentName: n.data.agentName,
      branch: n.data.branch,
      isFrontier: n.data.isFrontier,
      isVisited: n.data.isVisited,
      tool: n.data.tool,
      decision: n.data.decision,
      success: n.data.success,
      timestamp: n.data.timestamp,
      position: n.position,
    }));

    const causalEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type,
      animated: e.animated,
      label: e.label,
    }));

    return NextResponse.json({
      causalNodes,
      causalEdges,
      frontier: frontierView,
      eventStream,
      agents: agentViews,
      transitionCount: runState?.eventCount ?? events.length,
      totalEvents: events.length,
      // Derive run status from kernel if available, otherwise infer from events
      runStatus: status ?? deriveRunStatus(events),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
