import { create } from "zustand";
import { type Node, type Edge } from "@xyflow/react";

// Types
export type AgentInfo = {
  id: string;
  name: string;
  goal: string;
  personality: string;
  tools: string[];
  shortTermMemory: boolean;
  longTermMemory: boolean;
  maxSteps: number;
  autoRun: boolean;
  outputFormat: string;
  graphData: { nodes: Node[]; edges: Edge[] } | null;
  runCount?: number;
  // V2 fields
  role: string;
  model: string;
  orchestrationMode: string;
  maxConcurrency: number;
  reflectionEnabled: boolean;
  reflectionMaxIter: number;
  reflectionCriteria: string;
  teamId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RunInfo = {
  id: string;
  agentId: string;
  agentName?: string;
  status: string;
  result?: string;
  stepCount?: number;
  totalTokens?: number;
  totalLatencyMs?: number;
  createdAt: string;
};

export type AgentEvent = {
  type: "status" | "plan" | "action" | "result" | "thinking" | "error" | "done" | "reflection" | "policy" | "handoff" | "group_message";
  message: string;
  step?: number;
  data?: Record<string, unknown>;
};

export type ViewMode = "canvas" | "builder" | "history";
export type AppModule = "canvas" | "router" | "pipeline" | "workflow" | "hermes";

// V2 new types
export type PolicyRuleInfo = {
  id: string;
  name: string;
  description?: string;
  condition: Record<string, unknown>;
  action: string;
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalInfo = {
  id: string;
  agentId: string;
  runId?: string;
  tool: string;
  input: string;
  riskLevel: string;
  status: string;
  requestedAt: string;
};

export type SystemMetricsInfo = {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  activeRuns: number;
  totalAgents: number;
  totalTokensUsed: number;
  avgLatencyMs: number;
  avgStepsPerRun: number;
  errorRate: number;
};

export type TeamInfo = {
  id: string;
  name: string;
  mode: string;
  maxConcurrency: number;
  terminationType: string;
  terminationValue: number;
  sharedContext: boolean;
  agentCount: number;
  agents: { id: string; name: string; role: string }[];
  createdAt: string;
  updatedAt: string;
};

interface AgentStore {
  // Data
  agents: AgentInfo[];
  selectedAgentId: string | null;
  runs: RunInfo[];
  currentRunId: string | null;
  events: AgentEvent[];
  error: string | null;

  // V2 Data
  teams: TeamInfo[];
  policies: PolicyRuleInfo[];
  pendingApprovals: ApprovalInfo[];
  systemMetrics: SystemMetricsInfo | null;

  // Canvas
  canvasNodes: Node[];
  canvasEdges: Edge[];

  // UI State
  viewMode: ViewMode;
  activeModule: AppModule;
  inspectorOpen: boolean;
  sidebarOpen: boolean;
  builderOpen: boolean;
  isBuilding: boolean;
  isRunning: boolean;

  // Actions
  setAgents: (agents: AgentInfo[]) => void;
  addAgent: (agent: AgentInfo) => void;
  updateAgent: (id: string, updates: Partial<AgentInfo>) => void;
  removeAgent: (id: string) => void;
  selectAgent: (id: string | null) => void;
  setRuns: (runs: RunInfo[]) => void;
  addRun: (run: RunInfo) => void;
  setCurrentRunId: (id: string | null) => void;
  addEvent: (event: AgentEvent) => void;
  clearEvents: () => void;
  setCanvasNodes: (nodes: Node[]) => void;
  setCanvasEdges: (edges: Edge[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setActiveModule: (module: AppModule) => void;
  setInspectorOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setBuilderOpen: (open: boolean) => void;
  setIsBuilding: (building: boolean) => void;
  setIsRunning: (running: boolean) => void;
  clearError: () => void;

  // Async actions
  fetchAgents: () => Promise<void>;
  fetchRuns: (agentId?: string) => Promise<void>;
  buildAgent: (userInput: string) => Promise<AgentInfo | null>;
  createAgent: (data: Partial<AgentInfo>) => Promise<AgentInfo | null>;
  deleteAgent: (id: string) => Promise<boolean>;
  startRun: (agentId: string, goal?: string) => Promise<string | null>;
  stopRun: (runId: string) => Promise<void>;
  updateAgentConfig: (id: string, updates: Record<string, unknown>) => Promise<void>;

  // V2 Async actions
  fetchTeams: () => Promise<void>;
  createTeam: (data: { name: string; mode: string; agentIds: string[] }) => Promise<void>;
  fetchPolicies: () => Promise<void>;
  createPolicy: (data: Record<string, unknown>) => Promise<void>;
  updatePolicy: (id: string, data: Record<string, unknown>) => Promise<void>;
  deletePolicy: (id: string) => Promise<void>;
  fetchPendingApprovals: () => Promise<void>;
  respondApproval: (id: string, approved: boolean) => Promise<void>;
  fetchSystemMetrics: () => Promise<void>;
  runTeam: (teamId: string, goal?: string) => Promise<string | null>;
}

function generateCanvasNodes(agents: AgentInfo[]): Node[] {
  return agents.map((agent, i) => ({
    id: agent.id,
    type: "agentNode",
    position: { x: 100 + (i % 3) * 280, y: 100 + Math.floor(i / 3) * 200 },
    data: {
      label: agent.name,
      goal: agent.goal,
      role: agent.role || agent.personality,
      tools: agent.tools,
      status: "idle" as const,
      agentRole: agent.role,
    },
  }));
}

function generateCanvasEdges(agents: AgentInfo[]): Edge[] {
  return agents.slice(0, -1).map((agent, i) => ({
    id: `${agent.id}-${agents[i + 1].id}`,
    source: agent.id,
    target: agents[i + 1].id,
    type: "smoothstep",
    animated: true,
  }));
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  // Initial state
  agents: [],
  selectedAgentId: null,
  runs: [],
  currentRunId: null,
  events: [],
  error: null,
  // V2 initial state
  teams: [],
  policies: [],
  pendingApprovals: [],
  systemMetrics: null,
  canvasNodes: [],
  canvasEdges: [],
  viewMode: "canvas",
  activeModule: "canvas",
  inspectorOpen: true,
  sidebarOpen: true,
  builderOpen: false,
  isBuilding: false,
  isRunning: false,

  // Simple setters
  setAgents: (agents) => set({ agents }),
  addAgent: (agent) => set((s) => ({ agents: [agent, ...s.agents] })),
  updateAgent: (id, updates) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeAgent: (id) => set((s) => ({
    agents: s.agents.filter((a) => a.id !== id),
    selectedAgentId: s.selectedAgentId === id ? null : s.selectedAgentId,
  })),
  selectAgent: (id) => set({ selectedAgentId: id, inspectorOpen: !!id }),
  setRuns: (runs) => set({ runs }),
  addRun: (run) => set((s) => ({ runs: [run, ...s.runs] })),
  setCurrentRunId: (id) => set({ currentRunId: id }),
  addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
  clearEvents: () => set({ events: [] }),
  setCanvasNodes: (nodes) => set({ canvasNodes: nodes }),
  setCanvasEdges: (edges) => set({ canvasEdges: edges }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveModule: (module) => set({ activeModule: module }),
  setInspectorOpen: (open) => set({ inspectorOpen: open }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setBuilderOpen: (open) => set({ builderOpen: open }),
  setIsBuilding: (building) => set({ isBuilding: building }),
  setIsRunning: (running) => set({ isRunning: running }),
  clearError: () => set({ error: null }),

  // Async actions — with proper error handling (FIX C09)
  fetchAgents: async () => {
    try {
      const res = await fetch("/api/agent/list");
      if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
      const data = await res.json();
      set({ agents: data, error: null });

      // FIX: Canvas persistence — restore from graphData or generate defaults
      const { canvasNodes, canvasEdges } = get();
      if (canvasNodes.length === 0 && data.length > 0) {
        // Try restoring from first agent's graphData
        const agentWithGraph = data.find((a: AgentInfo) => (a.graphData?.nodes?.length ?? 0) > 0);
        if (agentWithGraph?.graphData) {
          set({
            canvasNodes: agentWithGraph.graphData.nodes,
            canvasEdges: agentWithGraph.graphData.edges || [],
          });
        } else {
          set({
            canvasNodes: generateCanvasNodes(data),
            canvasEdges: generateCanvasEdges(data),
          });
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to fetch agents";
      set({ error: msg });
    }
  },

  fetchRuns: async (agentId) => {
    try {
      const url = agentId
        ? `/api/agent/runs?agentId=${agentId}`
        : "/api/agent/runs";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch runs: ${res.status}`);
      const data = await res.json();
      set({ runs: Array.isArray(data) ? data : [], error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to fetch runs";
      set({ error: msg });
    }
  },

  buildAgent: async (userInput) => {
    set({ isBuilding: true, error: null });
    try {
      const res = await fetch("/api/agent/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput, save: true }),
      });
      if (!res.ok) throw new Error(`Build failed: ${res.status}`);
      const data = await res.json();
      if (data.agent) {
        const agent: AgentInfo = {
          id: data.agent.id,
          name: data.config.name,
          goal: data.config.goal,
          personality: data.config.personality,
          tools: data.config.tools,
          shortTermMemory: data.config.memory.shortTerm,
          longTermMemory: data.config.memory.longTerm,
          maxSteps: data.config.loop.maxSteps,
          autoRun: data.config.loop.autoRun,
          outputFormat: data.config.outputs.format,
          graphData: null,
          role: data.config.role || "general",
          model: data.config.model || "gemini-2.5-pro",
          orchestrationMode: data.config.orchestrationMode || "single",
          maxConcurrency: data.config.maxConcurrency || 3,
          reflectionEnabled: data.config.reflectionEnabled || false,
          reflectionMaxIter: data.config.reflectionMaxIter || 3,
          reflectionCriteria: data.config.reflectionCriteria || "APPROVED",
          teamId: data.config.teamId || null,
          createdAt: data.agent.createdAt,
          updatedAt: data.agent.createdAt,
        };
        get().addAgent(agent);
        // Add canvas node for new agent
        const { canvasNodes } = get();
        const newNode: Node = {
          id: agent.id,
          type: "agentNode",
          position: { x: 100 + (canvasNodes.length % 3) * 280, y: 100 + Math.floor(canvasNodes.length / 3) * 200 },
          data: {
            label: agent.name,
            goal: agent.goal,
            role: agent.role,
            tools: agent.tools,
            status: "idle",
            agentRole: agent.role,
          },
        };
        set({ canvasNodes: [...canvasNodes, newNode], builderOpen: false, isBuilding: false });
        return agent;
      }
      set({ isBuilding: false });
      return null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Build agent failed";
      set({ isBuilding: false, error: msg });
      return null;
    }
  },

  createAgent: async (agentData) => {
    try {
      const res = await fetch("/api/agent/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentData),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      const data = await res.json();
      if (data.id) {
        get().addAgent(data as AgentInfo);
        return data as AgentInfo;
      }
      return null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Create agent failed";
      set({ error: msg });
      return null;
    }
  },

  deleteAgent: async (id) => {
    try {
      const res = await fetch(`/api/agent/delete?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        get().removeAgent(id);
        // Remove canvas node
        const { canvasNodes, canvasEdges } = get();
        set({
          canvasNodes: canvasNodes.filter((n) => n.id !== id),
          canvasEdges: canvasEdges.filter((e) => e.source !== id && e.target !== id),
          error: null,
        });
        return true;
      }
      return false;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Delete agent failed";
      set({ error: msg });
      return false;
    }
  },

  startRun: async (agentId, goal) => {
    set({ isRunning: true, events: [], error: null });
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, goal }),
      });
      if (!res.ok) throw new Error(`Start run failed: ${res.status}`);
      const data = await res.json();
      if (data.runId) {
        set({ currentRunId: data.runId });
        return data.runId;
      }
      set({ isRunning: false });
      return null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Start run failed";
      set({ isRunning: false, error: msg });
      return null;
    }
  },

  stopRun: async (runId) => {
    try {
      const res = await fetch("/api/agent/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      if (!res.ok) throw new Error(`Stop run failed: ${res.status}`);
      set({ isRunning: false, currentRunId: null, error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Stop run failed";
      set({ error: msg });
    }
  },

  updateAgentConfig: async (id, updates) => {
    try {
      // Optimistic update
      get().updateAgent(id, updates as Partial<AgentInfo>);

      const res = await fetch("/api/agent/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) {
        // Rollback on failure — re-fetch to get server state
        throw new Error(`Update failed: ${res.status}`);
      }
      set({ error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Update agent failed";
      set({ error: msg });
      // Re-fetch to restore correct state
      get().fetchAgents();
    }
  },

  // V2 Async actions
  fetchTeams: async () => {
    try {
      const res = await fetch("/api/team/list");
      if (!res.ok) throw new Error(`Failed to fetch teams: ${res.status}`);
      const data = await res.json();
      set({ teams: Array.isArray(data) ? data : [], error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to fetch teams";
      set({ error: msg });
    }
  },

  createTeam: async (teamData) => {
    try {
      const res = await fetch("/api/team/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamData),
      });
      if (!res.ok) throw new Error(`Create team failed: ${res.status}`);
      await get().fetchTeams();
      set({ error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Create team failed";
      set({ error: msg });
    }
  },

  fetchPolicies: async () => {
    try {
      const res = await fetch("/api/policy/list");
      if (!res.ok) throw new Error(`Failed to fetch policies: ${res.status}`);
      const data = await res.json();
      set({ policies: Array.isArray(data) ? data : [], error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to fetch policies";
      set({ error: msg });
    }
  },

  createPolicy: async (policyData) => {
    try {
      const res = await fetch("/api/policy/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policyData),
      });
      if (!res.ok) throw new Error(`Create policy failed: ${res.status}`);
      await get().fetchPolicies();
      set({ error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Create policy failed";
      set({ error: msg });
    }
  },

  updatePolicy: async (id, policyData) => {
    try {
      const res = await fetch("/api/policy/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...policyData }),
      });
      if (!res.ok) throw new Error(`Update policy failed: ${res.status}`);
      await get().fetchPolicies();
      set({ error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Update policy failed";
      set({ error: msg });
    }
  },

  deletePolicy: async (id) => {
    try {
      const res = await fetch("/api/policy/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(`Delete policy failed: ${res.status}`);
      await get().fetchPolicies();
      set({ error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Delete policy failed";
      set({ error: msg });
    }
  },

  fetchPendingApprovals: async () => {
    try {
      const res = await fetch("/api/approval/list");
      if (!res.ok) throw new Error(`Failed to fetch approvals: ${res.status}`);
      const data = await res.json();
      set({ pendingApprovals: Array.isArray(data) ? data : [], error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to fetch approvals";
      set({ error: msg });
    }
  },

  respondApproval: async (id, approved) => {
    try {
      const res = await fetch("/api/approval/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approved }),
      });
      if (!res.ok) throw new Error(`Respond approval failed: ${res.status}`);
      await get().fetchPendingApprovals();
      set({ error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Respond approval failed";
      set({ error: msg });
    }
  },

  fetchSystemMetrics: async () => {
    try {
      const res = await fetch("/api/metrics/system");
      if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.status}`);
      const data = await res.json();
      set({ systemMetrics: data, error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to fetch metrics";
      set({ error: msg });
    }
  },

  runTeam: async (teamId, goal) => {
    set({ isRunning: true, events: [], error: null });
    try {
      const res = await fetch("/api/team/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, goal }),
      });
      if (!res.ok) throw new Error(`Start team run failed: ${res.status}`);
      const data = await res.json();
      if (data.runId) {
        set({ currentRunId: data.runId });
        return data.runId;
      }
      set({ isRunning: false });
      return null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Start team run failed";
      set({ isRunning: false, error: msg });
      return null;
    }
  },
}));
