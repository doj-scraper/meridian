/**
 * Centralized Validation Schemas
 * Zod v4 compatible schemas for all POST/PUT request bodies
 */

import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

// Agent Schemas
export const AgentCreateSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).max(100),
  goal: z.string().min(1, { message: "Goal is required" }).max(1000),
  personality: z.string().default("helpful assistant"),
  tools: z.array(z.enum(["search", "write", "code", "browser", "finish", "save_memory", "read_memory"])).default(["search", "write"]),
  role: z.enum(["general", "planner", "researcher", "executor", "critic", "reviewer"]).default("general"),
  model: z.string().default("gemini-2.5-pro"),
  orchestrationMode: z.enum(["single", "sequential", "group", "hierarchical", "parallel"]).default("single"),
  maxConcurrency: z.number().int().min(1).max(10).default(3),
  maxSteps: z.number().int().min(1).max(50).default(10),
  autoRun: z.boolean().default(true),
  outputFormat: z.enum(["text", "json", "markdown"]).default("markdown"),
  reflectionEnabled: z.boolean().default(false),
  reflectionMaxIter: z.number().int().min(1).max(10).default(3),
  reflectionCriteria: z.string().default("APPROVED"),
  shortTermMemory: z.boolean().default(true),
  longTermMemory: z.boolean().default(false),
  teamId: z.string().nullable().optional(),
  graphData: z.any().nullable().optional(),
});

export const AgentUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  goal: z.string().min(1).max(1000).optional(),
  personality: z.string().optional(),
  tools: z.array(z.string()).optional(),
  role: z.enum(["general", "planner", "researcher", "executor", "critic", "reviewer"]).optional(),
  model: z.string().optional(),
  orchestrationMode: z.enum(["single", "sequential", "group", "hierarchical", "parallel"]).optional(),
  maxConcurrency: z.number().int().min(1).max(10).optional(),
  maxSteps: z.number().int().min(1).max(50).optional(),
  autoRun: z.boolean().optional(),
  outputFormat: z.enum(["text", "json", "markdown"]).optional(),
  reflectionEnabled: z.boolean().optional(),
  reflectionMaxIter: z.number().int().min(1).max(10).optional(),
  reflectionCriteria: z.string().optional(),
  shortTermMemory: z.boolean().optional(),
  longTermMemory: z.boolean().optional(),
  teamId: z.string().nullable().optional(),
  graphData: z.any().nullable().optional(),
});

export const AgentRunSchema = z.object({
  agentId: z.string().cuid(),
  goal: z.string().optional(),
});

export const AgentStopSchema = z.object({
  runId: z.string(),
});

// Team Schemas
export const TeamCreateSchema = z.object({
  name: z.string().min(1, { message: "Team name is required" }).max(100),
  mode: z.enum(["sequential", "group", "hierarchical", "parallel"]).default("sequential"),
  maxConcurrency: z.number().int().min(1).max(10).default(3),
  terminationType: z.enum(["max_steps", "text_mention", "max_messages"]).optional(),
  terminationValue: z.number().int().optional(),
  sharedContext: z.boolean().default(true),
  agentIds: z.array(z.string().cuid()).default([]),
});

export const TeamUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  mode: z.enum(["sequential", "group", "hierarchical", "parallel"]).optional(),
  maxConcurrency: z.number().int().min(1).max(10).optional(),
  terminationType: z.enum(["max_steps", "text_mention", "max_messages"]).optional(),
  terminationValue: z.number().int().optional(),
  sharedContext: z.boolean().optional(),
  agentIds: z.array(z.string().cuid()).optional(),
});

export const TeamRunSchema = z.object({
  teamId: z.string().cuid(),
  goal: z.string().optional(),
});

export const TeamStopSchema = z.object({
  runId: z.string(),
});

// Template Schemas
export const TemplateCreateSchema = z.object({
  name: z.string().min(1, { message: "Template name is required" }).max(100),
  description: z.string().optional(),
  category: z.string().optional(),
  config: z.object({
    personality: z.string().optional(),
    tools: z.array(z.string()).optional(),
    role: z.string().optional(),
    model: z.string().optional(),
    maxSteps: z.number().int().optional(),
    orchestrationMode: z.string().optional(),
    reflectionEnabled: z.boolean().optional(),
    reflectionMaxIter: z.number().int().optional(),
    shortTermMemory: z.boolean().optional(),
    longTermMemory: z.boolean().optional(),
  }),
});

export const TemplateInstantiateSchema = z.object({
  templateId: z.string().cuid(),
  name: z.string().min(1, { message: "Name is required" }).max(100),
  goal: z.string().min(1, { message: "Goal is required" }).max(1000),
  overrides: z.record(z.any()).optional(),
});

// Policy Schemas
export const PolicyCreateSchema = z.object({
  name: z.string().min(1, { message: "Policy name is required" }).max(100),
  action: z.enum(["allow", "block", "ask_user", "shadow"]),
  priority: z.number().int().min(0).max(100).default(50),
  enabled: z.boolean().default(true),
  conditions: z.object({
    tool: z.array(z.string()).optional(),
    role: z.array(z.string()).optional(),
    riskLevel: z.array(z.enum(["low", "medium", "high", "critical"])).optional(),
    agentId: z.array(z.string()).optional(),
  }),
});

export const PolicyUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  action: z.enum(["allow", "block", "ask_user", "shadow"]).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  enabled: z.boolean().optional(),
  conditions: z.object({
    tool: z.array(z.string()).optional(),
    role: z.array(z.string()).optional(),
    riskLevel: z.array(z.enum(["low", "medium", "high", "critical"])).optional(),
    agentId: z.array(z.string()).optional(),
  }).optional(),
});

// Approval Schemas
export const ApprovalRespondSchema = z.object({
  id: z.string().cuid(),
  decision: z.enum(["approved", "denied"]),
  reason: z.string().optional(),
});

// Memory Schemas
export const MemorySetSchema = z.object({
  agentId: z.string().cuid(),
  key: z.string().min(1, { message: "Key is required" }),
  value: z.any(),
  tier: z.enum(["session", "persistent", "artifact"]),
  runId: z.string().optional(),
});

// Trigger Schemas
export const TriggerCreateSchema = z.object({
  name: z.string().min(1, { message: "Trigger name is required" }).max(100),
  agentId: z.string().cuid(),
  type: z.enum(["schedule", "webhook", "event"]),
  schedule: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  eventType: z.string().optional(),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional(),
});

export const TriggerUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["schedule", "webhook", "event"]).optional(),
  schedule: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  eventType: z.string().optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

export const TriggerExecuteSchema = z.object({
  id: z.string().cuid(),
});

// Task Graph Schemas
export const TaskNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["agent", "condition", "merge"]),
  agentId: z.string().cuid().optional(),
  condition: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.any()).optional(),
});

export const TaskEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  condition: z.string().optional(),
});

export const TaskGraphCreateSchema = z.object({
  name: z.string().min(1, { message: "Graph name is required" }).max(100),
  description: z.string().optional(),
  nodes: z.array(TaskNodeSchema),
  edges: z.array(TaskEdgeSchema),
});

export const TaskGraphUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  nodes: z.array(TaskNodeSchema).optional(),
  edges: z.array(TaskEdgeSchema).optional(),
});

// Hermes Schemas
export const HermesRunSchema = z.object({
  goal: z.string().min(1, { message: "Goal is required" }).max(1000),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  agentRole: z.enum(["general", "planner", "researcher", "executor", "critic", "reviewer"]).default("general"),
  agentTools: z.array(z.string()).default(["search", "write", "code", "browser"]),
  maxTransitions: z.number().int().min(1).max(50).default(10),
});

export const HermesStopSchema = z.object({
  runId: z.string(),
});

// Type Exports
export type AgentCreateInput = z.infer<typeof AgentCreateSchema>;
export type AgentUpdateInput = z.infer<typeof AgentUpdateSchema>;
export type AgentRunInput = z.infer<typeof AgentRunSchema>;
export type AgentStopInput = z.infer<typeof AgentStopSchema>;

export type TeamCreateInput = z.infer<typeof TeamCreateSchema>;
export type TeamUpdateInput = z.infer<typeof TeamUpdateSchema>;
export type TeamRunInput = z.infer<typeof TeamRunSchema>;
export type TeamStopInput = z.infer<typeof TeamStopSchema>;

export type TemplateCreateInput = z.infer<typeof TemplateCreateSchema>;
export type TemplateInstantiateInput = z.infer<typeof TemplateInstantiateSchema>;

export type PolicyCreateInput = z.infer<typeof PolicyCreateSchema>;
export type PolicyUpdateInput = z.infer<typeof PolicyUpdateSchema>;

export type ApprovalRespondInput = z.infer<typeof ApprovalRespondSchema>;

export type MemorySetInput = z.infer<typeof MemorySetSchema>;

export type TriggerCreateInput = z.infer<typeof TriggerCreateSchema>;
export type TriggerUpdateInput = z.infer<typeof TriggerUpdateSchema>;
export type TriggerExecuteInput = z.infer<typeof TriggerExecuteSchema>;

export type TaskGraphCreateInput = z.infer<typeof TaskGraphCreateSchema>;
export type TaskGraphUpdateInput = z.infer<typeof TaskGraphUpdateSchema>;

export type HermesRunInput = z.infer<typeof HermesRunSchema>;
export type HermesStopInput = z.infer<typeof HermesStopSchema>;

// Validation Helpers
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function safeValidateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (req: NextRequest): Promise<T | NextResponse> => {
    try {
      const body = await req.json();
      const result = schema.safeParse(body);
      if (!result.success) {
        // Expose first error message
        const firstError = result.error.issues[0]?.message || "Invalid input";
        return NextResponse.json({ error: firstError }, { status: 400 });
      }
      return result.data;
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  };
}
