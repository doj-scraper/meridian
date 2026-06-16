/**
 * Hermes Causal Graph Store
 *
 * Client-side Zustand store for the Hermes Causal DAG Architecture.
 * Provides reactive state for the causal graph visualization,
 * frontier status, event stream, and agent projections.
 *
 * This store is a PROJECTION — it never defines truth.
 * Truth is in the event log. This store merely caches
 * projections for efficient UI rendering.
 *
 * POLLING ARCHITECTURE:
 * After startRun(), the store polls /api/hermes/state every 1.5s
 * to reflect kernel transition progress. Polling stops when the
 * run reaches a terminal state (completed/failed/stopped) or when
 * the component unmounts.
 */

import { create } from "zustand";

// ═══════════════════════════════════════════════════════════════
// Polling Manager
// ═══════════════════════════════════════════════════════════════

const POLL_INTERVAL_MS = 1500;
const TERMINAL_STATES = new Set(["completed", "failed", "stopped"]);

let pollTimer: ReturnType<typeof setInterval> | null = null;

function startPolling(runId: string, fetchState: (runId: string) => Promise<void>) {
  stopPolling(); // Clear any existing poll
  pollTimer = setInterval(() => {
    fetchState(runId).catch(() => {
      // Silently ignore fetch errors during polling
    });
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATES.has(status);
}

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface CausalNodeView {
  id: string;
  tier: string;
  label: string;
  depth: number;
  agentName?: string;
  branch?: string;
  isFrontier: boolean;
  isVisited: boolean;
  tool?: string;
  decision?: string;
  success?: boolean;
  timestamp: number;
  position: { x: number; y: number };
}

export interface CausalEdgeView {
  id: string;
  source: string;
  target: string;
  type: "causal" | "temporal" | "branch";
  animated: boolean;
  label?: string;
}

export interface FrontierView {
  frontierNodeIds: string[];
  visitedNodeIds: string[];
  isExhausted: boolean;
  activeBranches: string[];
  size: number;
}

export interface EventStreamItem {
  id: string;
  tier: string;
  label: string;
  depth: number;
  agentName?: string;
  timestamp: number;
  summary: string;
  isFrontier: boolean;
  branch?: string;
  parentIds: string[];
}

export interface AgentView {
  id: string;
  name: string;
  role: string;
  status: "idle" | "proposing" | "executing" | "waiting" | "done";
  proposalCount: number;
  executionCount: number;
  color: string;
  totalTokens: number;
}

export type HermesViewMode = "causal-graph" | "event-stream" | "frontier" | "hqa";

// ═══════════════════════════════════════════════════════════════
// Store State
// ═══════════════════════════════════════════════════════════════

interface HermesStoreState {
  // Causal graph visualization
  causalNodes: CausalNodeView[];
  causalEdges: CausalEdgeView[];

  // Frontier state
  frontier: FrontierView | null;

  // Event stream
  eventStream: EventStreamItem[];

  // Agent states
  agents: AgentView[];

  // Run state
  activeRunId: string | null;
  runStatus: "idle" | "running" | "paused" | "completed" | "failed" | "stopped";
  runGoal: string;
  transitionCount: number;
  totalEvents: number;

  // UI state
  viewMode: HermesViewMode;
  selectedEventId: string | null;
  hqaQueryResult: unknown | null;
  isLoading: boolean;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════
// Store Actions
// ═══════════════════════════════════════════════════════════════

interface HermesStoreActions {
  // Causal graph
  setCausalGraph: (nodes: CausalNodeView[], edges: CausalEdgeView[]) => void;

  // Frontier
  setFrontier: (frontier: FrontierView) => void;

  // Event stream
  addEvent: (event: EventStreamItem) => void;
  setEventStream: (events: EventStreamItem[]) => void;

  // Agents
  setAgents: (agents: AgentView[]) => void;

  // Run control
  startRun: (goal: string) => Promise<void>;
  stopRun: () => Promise<void>;
  setRunStatus: (status: HermesStoreState["runStatus"]) => void;

  // UI
  setViewMode: (mode: HermesViewMode) => void;
  setSelectedEvent: (eventId: string | null) => void;
  setHqaResult: (result: unknown) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Fetch data from API
  fetchRunState: (runId: string) => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════
// Initial State
// ═══════════════════════════════════════════════════════════════

const initialState: HermesStoreState = {
  causalNodes: [],
  causalEdges: [],
  frontier: null,
  eventStream: [],
  agents: [],
  activeRunId: null,
  runStatus: "idle",
  runGoal: "",
  transitionCount: 0,
  totalEvents: 0,
  viewMode: "causal-graph",
  selectedEventId: null,
  hqaQueryResult: null,
  isLoading: false,
  error: null,
};

// ═══════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════

export const useHermesStore = create<HermesStoreState & HermesStoreActions>((set, get) => ({
  ...initialState,

  setCausalGraph: (nodes, edges) =>
    set({ causalNodes: nodes, causalEdges: edges }),

  setFrontier: (frontier) =>
    set({ frontier }),

  addEvent: (event) =>
    set((state) => ({
      eventStream: [...state.eventStream, event],
      totalEvents: state.totalEvents + 1,
    })),

  setEventStream: (events) =>
    set({ eventStream: events, totalEvents: events.length }),

  setAgents: (agents) =>
    set({ agents }),

  startRun: async (goal) => {
    set({ isLoading: true, error: null, runGoal: goal });
    try {
      const res = await fetch("/api/hermes/run?XTransformPort=3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      if (!res.ok) throw new Error("Failed to start Hermes run");
      const data = await res.json();
      const runId = data.runId;
      set({
        activeRunId: runId,
        runStatus: "running",
        isLoading: false,
      });
      // Start polling for state updates
      startPolling(runId, get().fetchRunState);
      // Also do an immediate fetch to show the genesis event
      await get().fetchRunState(runId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to start run",
        isLoading: false,
        runStatus: "idle",
      });
    }
  },

  stopRun: async () => {
    const { activeRunId } = get();
    if (!activeRunId) return;
    try {
      await fetch(`/api/hermes/stop?XTransformPort=3000`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: activeRunId }),
      });
      set({ runStatus: "stopped" });
      stopPolling();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to stop run" });
    }
  },

  setRunStatus: (status) => set({ runStatus: status }),

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedEvent: (eventId) => set({ selectedEventId: eventId }),
  setHqaResult: (result) => set({ hqaQueryResult: result }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  reset: () => set(initialState),

  fetchRunState: async (runId) => {
    try {
      const res = await fetch(`/api/hermes/state?XTransformPort=3000&runId=${runId}`);
      if (!res.ok) throw new Error("Failed to fetch run state");
      const data = await res.json();
      const runStatus = data.runStatus ?? "idle";
      set({
        causalNodes: data.causalNodes ?? [],
        causalEdges: data.causalEdges ?? [],
        frontier: data.frontier ?? null,
        eventStream: data.eventStream ?? [],
        agents: data.agents ?? [],
        transitionCount: data.transitionCount ?? 0,
        totalEvents: data.totalEvents ?? 0,
        runStatus: runStatus as HermesStoreState["runStatus"],
        isLoading: false,
      });
      // Stop polling if the run has reached a terminal state
      if (isTerminalStatus(runStatus)) {
        stopPolling();
      }
    } catch (error) {
      // Don't overwrite state on poll failure — just skip this cycle
    }
  },
}));
