/**
 * @hermes/kernel-spine — Pure State Reducer
 *
 * THE REDUCER IS THE CANONICAL INTERPRETATION OF THE EVENT LOG.
 *
 * Kernel Non-Duality Principle:
 *   Event Log = Truth, Reducer = Canonical Interpretation.
 *   No dual-state systems. The reducer does not maintain separate
 *   state — it derives state from events.
 *
 * The reducer is a PURE FUNCTION:
 *   HermesState = f(HermesEvent[])
 *
 * Given the same event log, the reducer ALWAYS produces the same
 * state. This is the foundation of:
 *   - Deterministic replay
 *   - State verification
 *   - Debugging (state at any point = reduce(events up to that point))
 *   - Branching (fork the log, reduce independently)
 */

import type { HermesEvent } from "../event-dsl/types";
import type {
  HermesState,
  RunState,
  AgentState,
  FrontierInfo,
  HermesMetadata,
} from "./types";

// ═══════════════════════════════════════════════════════════════
// Initial State
// ═══════════════════════════════════════════════════════════════

/**
 * Create the initial empty HermesState.
 */
export function createInitialState(): HermesState {
  return {
    runs: new Map(),
    agents: new Map(),
    frontiers: new Map(),
    visited: new Map(),
    activeBranches: new Map(),
    metadata: {
      totalEvents: 0,
      totalTransitions: 0,
      systemStatus: "idle",
      lastUpdatedAt: Date.now(),
      schemaVersion: 1,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// Full Reduction
// ═══════════════════════════════════════════════════════════════

/**
 * Reduce a complete event log into a HermesState.
 *
 * This is the canonical state derivation function.
 * Given the same events, it ALWAYS produces the same state.
 *
 * @param events - Complete event log for a run
 * @returns The derived HermesState
 */
export function reduceEvents(events: HermesEvent[]): HermesState {
  const state = createInitialState();

  for (const event of events) {
    applyEvent(state, event);
  }

  return state;
}

/**
 * Reduce an event log starting from an existing state (checkpoint).
 * Used for incremental state updates.
 */
export function reduceFromCheckpoint(
  checkpointState: HermesState,
  newEvents: HermesEvent[]
): HermesState {
  // Deep clone to avoid mutation
  const state = cloneState(checkpointState);

  for (const event of newEvents) {
    applyEvent(state, event);
  }

  return state;
}

// ═══════════════════════════════════════════════════════════════
// Single Event Application
// ═══════════════════════════════════════════════════════════════

/**
 * Apply a single event to the state.
 * This mutates the state object in-place for efficiency.
 * For immutable semantics, use reduceEvents() which starts fresh.
 */
function applyEvent(state: HermesState, event: HermesEvent): void {
  const runId = String(event.runId);
  const agentId = event.agentId ? String(event.agentId) : undefined;

  // Update metadata
  state.metadata.totalEvents++;
  state.metadata.lastUpdatedAt = Date.now();

  // Apply tier-specific logic
  switch (event.eventType) {
    case "SYSTEM":
      applySystemEvent(state, event, runId);
      break;
    case "MODEL":
      applyModelEvent(state, event, runId, agentId);
      break;
    case "DECISION":
      applyDecisionEvent(state, event, runId, agentId);
      break;
    case "EXECUTION":
      applyExecutionEvent(state, event, runId, agentId);
      break;
    case "TELEMETRY":
      applyTelemetryEvent(state, event, runId);
      break;
  }

  // Update visited set
  if (!state.visited.has(runId)) {
    state.visited.set(runId, new Set());
  }
  state.visited.get(runId)!.add(String(event.eventId));

  // Update branch tracking
  if (event.branch) {
    if (!state.activeBranches.has(runId)) {
      state.activeBranches.set(runId, new Set());
    }
    state.activeBranches.get(runId)!.add(event.branch);
  }
}

// ═══════════════════════════════════════════════════════════════
// Tier-Specific Reducers
// ═══════════════════════════════════════════════════════════════

function applySystemEvent(
  state: HermesState,
  event: HermesEvent,
  runId: string
): void {
  const payload = event.payload as { subtype?: string; message?: string };
  const subtype = payload.subtype;

  // Ensure run exists
  if (!state.runs.has(runId)) {
    state.runs.set(runId, {
      runId,
      status: "pending",
      goal: "",
      eventCount: 0,
      maxDepth: 0,
      totalTokens: 0,
      totalLatencyMs: 0,
      errorCount: 0,
    });
  }

  const run = state.runs.get(runId)!;
  run.eventCount++;
  run.maxDepth = Math.max(run.maxDepth, event.causalDepth);

  switch (subtype) {
    case "run_start":
      run.status = "running";
      run.startedAt = event.timestamp;
      state.metadata.systemStatus = "running";
      break;
    case "run_complete":
      run.status = "completed";
      run.completedAt = event.timestamp;
      run.result = payload.message;
      // Check if all runs are completed
      const allCompleted = Array.from(state.runs.values()).every(
        (r) => r.status === "completed" || r.status === "failed" || r.status === "stopped"
      );
      if (allCompleted) state.metadata.systemStatus = "idle";
      break;
    case "run_error":
      run.status = "failed";
      run.errorCount++;
      run.completedAt = event.timestamp;
      break;
    case "run_stopped":
      run.status = "stopped";
      run.completedAt = event.timestamp;
      break;
    case "agent_registered":
      if (event.agentId) {
        const aId = String(event.agentId);
        if (!state.agents.has(aId)) {
          state.agents.set(aId, {
            agentId: aId,
            name: (payload as Record<string, unknown>).name as string || aId,
            role: (payload as Record<string, unknown>).role as string || "general",
            status: "idle",
            proposalCount: 0,
            executionCount: 0,
            errorCount: 0,
            totalTokens: 0,
          });
        }
      }
      break;
    case "policy_applied":
      // Policy decisions don't change state structure
      break;
    case "checkpoint_created":
      // Checkpoint events are informational
      break;
    case "branch_created":
      if (event.branch) {
        if (!state.activeBranches.has(runId)) {
          state.activeBranches.set(runId, new Set());
        }
        state.activeBranches.get(runId)!.add(event.branch);
      }
      break;
    case "branch_merged":
      // Branch merged — could optionally deactivate branch
      break;
  }
}

function applyModelEvent(
  state: HermesState,
  event: HermesEvent,
  runId: string,
  agentId?: string
): void {
  const payload = event.payload as { tokenUsage?: { totalTokens?: number }; latencyMs?: number };

  // Update run stats
  const run = state.runs.get(runId);
  if (run) {
    run.eventCount++;
    run.maxDepth = Math.max(run.maxDepth, event.causalDepth);
    run.totalTokens += payload.tokenUsage?.totalTokens ?? 0;
    run.totalLatencyMs += payload.latencyMs ?? 0;
  }

  // Update agent stats
  if (agentId) {
    const agent = state.agents.get(agentId);
    if (agent) {
      agent.totalTokens += payload.tokenUsage?.totalTokens ?? 0;
      agent.status = "proposing"; // After model call, agent will propose
    }
  }
}

function applyDecisionEvent(
  state: HermesState,
  event: HermesEvent,
  runId: string,
  agentId?: string
): void {
  // Update run stats
  const run = state.runs.get(runId);
  if (run) {
    run.eventCount++;
    run.maxDepth = Math.max(run.maxDepth, event.causalDepth);
  }

  // Update agent stats
  if (agentId) {
    const agent = state.agents.get(agentId);
    if (agent) {
      agent.proposalCount++;
      agent.status = "executing"; // After decision, agent executes
    }
  }
}

function applyExecutionEvent(
  state: HermesState,
  event: HermesEvent,
  runId: string,
  agentId?: string
): void {
  const payload = event.payload as { durationMs?: number; success?: boolean };

  // Update run stats
  const run = state.runs.get(runId);
  if (run) {
    run.eventCount++;
    run.maxDepth = Math.max(run.maxDepth, event.causalDepth);
    run.totalLatencyMs += payload.durationMs ?? 0;
    if (payload.success === false) {
      run.errorCount++;
    }
  }

  // Update agent stats
  if (agentId) {
    const agent = state.agents.get(agentId);
    if (agent) {
      agent.executionCount++;
      agent.status = "idle"; // After execution, agent is idle
    }
  }
}

function applyTelemetryEvent(
  state: HermesState,
  event: HermesEvent,
  runId: string
): void {
  // Telemetry events update stats but don't change control flow
  const run = state.runs.get(runId);
  if (run) {
    run.eventCount++;
    run.maxDepth = Math.max(run.maxDepth, event.causalDepth);
  }
}

// ═══════════════════════════════════════════════════════════════
// State Utilities
// ═══════════════════════════════════════════════════════════════

/**
 * Deep clone a HermesState.
 * Used for checkpoint creation and immutable state derivation.
 */
function cloneState(state: HermesState): HermesState {
  return {
    runs: new Map(
      Array.from(state.runs.entries()).map(([k, v]) => [k, { ...v }])
    ),
    agents: new Map(
      Array.from(state.agents.entries()).map(([k, v]) => [k, { ...v }])
    ),
    frontiers: new Map(
      Array.from(state.frontiers.entries()).map(([k, v]) => [k, { ...v, frontierEventIds: new Set(v.frontierEventIds) }])
    ),
    visited: new Map(
      Array.from(state.visited.entries()).map(([k, v]) => [k, new Set(v)])
    ),
    activeBranches: new Map(
      Array.from(state.activeBranches.entries()).map(([k, v]) => [k, new Set(v)])
    ),
    metadata: { ...state.metadata },
  };
}

/**
 * Compute a hash of the current state for integrity verification.
 * Used to detect state corruption and for checkpoint verification.
 */
export function computeStateHash(state: HermesState): string {
  // Simple hash based on event counts and run statuses
  const parts: string[] = [];
  parts.push(`events:${state.metadata.totalEvents}`);
  parts.push(`transitions:${state.metadata.totalTransitions}`);
  for (const [runId, run] of Array.from(state.runs.entries())) {
    parts.push(`run:${runId}:${run.status}:${run.eventCount}`);
  }
  const combined = parts.join("|");
  // Simple hash — in production would use SHA-256
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get the state of a specific run.
 */
export function getRunState(state: HermesState, runId: string): RunState | undefined {
  return state.runs.get(runId);
}

/**
 * Get the state of a specific agent.
 */
export function getAgentState(state: HermesState, agentId: string): AgentState | undefined {
  return state.agents.get(agentId);
}

/**
 * Get the frontier for a specific run.
 */
export function getFrontierInfo(state: HermesState, runId: string): FrontierInfo | undefined {
  return state.frontiers.get(runId);
}
