import { z } from "zod";

// ============ Agent Configuration ============

export type AgentTool = "search" | "write" | "code" | "browser" | "finish";
export type AgentRole = "general" | "planner" | "researcher" | "executor" | "critic" | "reviewer";
export type OrchestrationMode = "single" | "sequential" | "group" | "hierarchical" | "parallel";

export type AgentConfig = {
  id?: string;
  name: string;
  goal: string;
  personality?: string;
  tools: AgentTool[];
  memory: {
    shortTerm: boolean;
    longTerm: boolean;
  };
  loop: {
    maxSteps: number;
    autoRun: boolean;
  };
  outputs: {
    format: "text" | "json" | "markdown";
  };
  // V2 additions
  role?: AgentRole;
  model?: string;
  orchestrationMode?: OrchestrationMode;
  reflectionEnabled?: boolean;
  reflectionMaxIter?: number;
  reflectionCriteria?: string;
  maxConcurrency?: number;
};

// ============ Agent Action ============

export type AgentAction = {
  tool: AgentTool;
  input: string;
};

// Zod schema for LLM action output validation
export const ActionSchema = z.object({
  tool: z.enum(["search", "write", "code", "browser", "finish"]),
  input: z.string().min(1),
});

// Zod schema for builder agent output
export const BuildAgentSchema = z.object({
  name: z.string().min(1),
  goal: z.string().min(1),
  personality: z.string().optional().default("helpful assistant"),
  tools: z.array(z.enum(["search", "write", "code", "browser"])),
  memory: z.object({
    shortTerm: z.boolean().default(true),
    longTerm: z.boolean().default(false),
  }).default({ shortTerm: true, longTerm: false }),
  loop: z.object({
    maxSteps: z.number().int().min(1).max(20).default(5),
    autoRun: z.boolean().default(true),
  }).default({ maxSteps: 5, autoRun: true }),
  outputs: z.object({
    format: z.enum(["text", "json", "markdown"]).default("markdown"),
  }).default({ format: "markdown" }),
});

// ============ Memory ============

export type MemoryEntry = {
  step: number;
  action: AgentAction;
  result: string;
  timestamp: number;
};

// ============ Events ============

export type AgentEventType =
  | "status"
  | "plan"
  | "action"
  | "result"
  | "thinking"
  | "error"
  | "done"
  | "reflection"
  | "policy"
  | "handoff"
  | "group_message"
  | "orchestration_start"
  | "orchestration_complete";

export type AgentEvent = {
  type: AgentEventType;
  message: string;
  step?: number;
  nodeId?: string;
  agentId?: string;
  agentName?: string;
  data?: Record<string, unknown>;
};

// ============ Run ============

export type RunStatus = "pending" | "running" | "completed" | "failed" | "stopped";

// ============ Verification ============

export type VerificationStatus = "verified" | "failed" | "needs_review";

export type VerificationResult = {
  status: VerificationStatus;
  message: string;
  details?: Record<string, unknown>;
};

// ============ Policy ============

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type PolicyAction = "allow" | "block" | "ask_user" | "shadow";

// ============ Team ============

export interface TeamInfo {
  id: string;
  name: string;
  mode: OrchestrationMode;
  maxConcurrency: number;
  terminationType: string;
  terminationValue: number;
  sharedContext: boolean;
  agentCount: number;
  agents: { id: string; name: string; role: AgentRole }[];
  createdAt: string;
  updatedAt: string;
}

// ============ System State ============

export type SystemState = "idle" | "planning" | "running" | "waiting_approval" | "error" | "completed";
