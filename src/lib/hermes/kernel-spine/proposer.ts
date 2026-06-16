/**
 * @hermes/kernel-spine — Agent Proposer
 *
 * Agents are PURE PROPOSERS in the Hermes architecture.
 * They NEVER execute tools or mutate state directly.
 *
 * The proposer interface:
 * 1. Receives the current derived state (read-only)
 * 2. Observes the causal frontier (what events can happen next)
 * 3. Returns a proposal for the next action
 *
 * The kernel decides whether to execute the proposal,
 * applies policy checks, and emits the resulting event.
 *
 * This separation ensures:
 * - Deterministic replay (proposals can be logged and replayed)
 * - Policy enforcement (proposals are checked before execution)
 * - Agent isolation (agents can't corrupt shared state)
 */

import { getZAI } from "@/lib/agent/zai-client";
import type { HermesEvent } from "../event-dsl/types";
import type {
  AgentProposal,
  ProposalAction,
  ToolAction,
  FinishAction,
} from "./types";
import type {
  BrandedAgentId,
  BrandedEventId,
  BrandedRunId,
} from "../test-harness/brands";

// ═══════════════════════════════════════════════════════════════
// Proposer Configuration
// ═══════════════════════════════════════════════════════════════

export interface ProposerConfig {
  /** The agent's ID */
  agentId: BrandedAgentId;
  /** The agent's name */
  name: string;
  /** The agent's role */
  role: string;
  /** Available tools for this agent */
  tools: string[];
  /** The agent's personality/system prompt modifier */
  personality: string;
  /** The goal this agent is working toward */
  goal: string;
  /** Maximum proposals this agent can make per run */
  maxProposals: number;
}

// ═══════════════════════════════════════════════════════════════
// Proposer Context (Read-Only View)
// ═══════════════════════════════════════════════════════════════

/**
 * Read-only context provided to the proposer.
 * The proposer CANNOT modify this — it can only observe.
 */
export interface ProposerContext {
  /** The run ID */
  runId: BrandedRunId;
  /** Events that have already been executed (visited) */
  visitedEventIds: Set<string>;
  /** Events currently in the frontier (can be executed next) */
  frontierEventIds: Set<string>;
  /** Recent events (last N for context window) */
  recentEvents: HermesEvent[];
  /** Available tools for this agent */
  availableTools: string[];
  /** Current branch (if any) */
  currentBranch?: string;
  /** Number of proposals already made */
  proposalCount: number;
}

// ═══════════════════════════════════════════════════════════════
// Proposer Interface
// ═══════════════════════════════════════════════════════════════

/**
 * Interface for an agent proposer.
 * Implementations use LLM to generate proposals.
 */
export interface IAgentProposer {
  /** Generate a proposal based on the current context */
  propose(context: ProposerContext): Promise<AgentProposal>;
  /** The proposer's configuration */
  readonly config: ProposerConfig;
}

// ═══════════════════════════════════════════════════════════════
// LLM-Based Proposer Implementation
// ═══════════════════════════════════════════════════════════════

/**
 * Agent proposer that uses z-ai-web-dev-sdk for LLM-based proposal generation.
 * This is the primary proposer implementation for Hermes agents.
 */
export class LLMAgentProposer implements IAgentProposer {
  readonly config: ProposerConfig;

  constructor(config: ProposerConfig) {
    this.config = config;
  }

  async propose(context: ProposerContext): Promise<AgentProposal> {
    try {
      const zai = await getZAI();

      // Build the prompt with context
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(context);

      console.log(`[Hermes Proposer] ${this.config.name} generating proposal #${context.proposalCount + 1}`);

      const response = await zai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        thinking: { type: "disabled" },
      });

      const content = response.choices[0]?.message?.content ?? "";

      console.log(`[Hermes Proposer] ${this.config.name} received response (${content.length} chars)`);

      // Parse the LLM response into a structured proposal
      return this.parseProposal(content, context);
    } catch (error) {
      console.error(`[Hermes Proposer] ${this.config.name} LLM call failed:`, error);
      // Return a fallback proposal instead of crashing
      return this.fallbackProposal(context, `LLM call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildSystemPrompt(context: ProposerContext): string {
    return `You are ${this.config.name}, a ${this.config.role} agent.
Your personality: ${this.config.personality}
Your goal: ${this.config.goal}
Available tools: ${this.config.tools.join(", ")}
Current branch: ${context.currentBranch ?? "main"}
Proposals made so far: ${context.proposalCount}

You must propose your next action as a JSON object with this exact format:
{
  "actionType": "use_tool" | "finish" | "delegate" | "wait",
  "tool": "<tool name if use_tool>",
  "input": "<input for the action>",
  "justification": "<why you chose this action>",
  "confidence": <0.0 to 1.0>,
  "priority": <integer, higher = more urgent>
}

RULES:
- You are a PROPOSER. You propose actions but do NOT execute them.
- Always respond with valid JSON matching the format above.
- If you believe the goal is achieved, use actionType "finish".
- Choose tools from: ${this.config.tools.join(", ")}`;
  }

  private buildUserPrompt(context: ProposerContext): string {
    const recentHistory = context.recentEvents
      .slice(-5)
      .map((e) => `[${String(e.eventType)}] ${this.summarizeEvent(e)}`)
      .join("\n");

    return `Context:
- Events executed: ${context.visitedEventIds.size}
- Frontier size: ${context.frontierEventIds.size}
- Recent activity:
${recentHistory || "(no events yet)"}

What is your next proposed action? Respond with JSON only.`;
  }

  private summarizeEvent(event: HermesEvent): string {
    const payload = event.payload as Record<string, unknown>;
    switch (event.eventType) {
      case "MODEL":
        return `Model call: ${(payload as { modelId?: string }).modelId ?? "unknown"}`;
      case "DECISION":
        return `Decision: ${(payload as { decision?: string }).decision ?? "unknown"}`;
      case "EXECUTION":
        return `Executed ${(payload as { tool?: string }).tool ?? "unknown"}: ${(payload as { success?: boolean }).success ? "success" : "failed"}`;
      case "SYSTEM":
        return `System: ${(payload as { subtype?: string }).subtype ?? "unknown"}`;
      case "TELEMETRY":
        return `Metric: ${(payload as { metric?: string }).metric ?? "unknown"}=${(payload as { value?: number }).value ?? 0}`;
      default:
        return "Unknown event";
    }
  }

  private parseProposal(content: string, context: ProposerContext): AgentProposal {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.fallbackProposal(context, "No JSON found in LLM response");
      }

      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

      const actionType = String(parsed.actionType ?? "use_tool");
      const tool = String(parsed.tool ?? "search");
      const input = String(parsed.input ?? "");
      const justification = String(parsed.justification ?? "No justification provided");
      const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;
      const priority = typeof parsed.priority === "number" ? parsed.priority : 0;

      let action: ProposalAction;
      if (actionType === "finish") {
        action = {
          type: "finish",
          result: input || "Goal achieved",
          summary: justification,
        } as FinishAction;
      } else {
        action = {
          type: "use_tool",
          tool,
          input,
        } as ToolAction;
      }

      return {
        agentId: this.config.agentId,
        actionType: actionType as AgentProposal["actionType"],
        action,
        justification,
        parentEventIds: this.selectParentEvents(context),
        confidence: Math.max(0, Math.min(1, confidence)),
        priority,
      };
    } catch {
      return this.fallbackProposal(context, "Failed to parse LLM response");
    }
  }

  private selectParentEvents(context: ProposerContext): BrandedEventId[] {
    // Select the most recent events as parents for causal linking
    const recentIds = context.recentEvents
      .slice(-3)
      .map((e) => e.eventId);
    return recentIds.length > 0 ? recentIds as BrandedEventId[] : [];
  }

  private fallbackProposal(context: ProposerContext, reason: string): AgentProposal {
    return {
      agentId: this.config.agentId,
      actionType: "use_tool",
      action: {
        type: "use_tool",
        tool: "search",
        input: this.config.goal,
      } as ToolAction,
      justification: `Fallback proposal: ${reason}`,
      parentEventIds: this.selectParentEvents(context),
      confidence: 0.1,
      priority: -1,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// Proposer Factory
// ═══════════════════════════════════════════════════════════════

/**
 * Create an LLM-based agent proposer from a configuration.
 */
export function createProposer(config: ProposerConfig): IAgentProposer {
  return new LLMAgentProposer(config);
}
