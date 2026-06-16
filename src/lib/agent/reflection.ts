import { EventEmitter } from "events";
import { getZAI } from "./zai-client";
import { emitEvent } from "./agent";

// ============ Reflection Loop System ============
// Research basis: The Evaluator-Optimizer pattern from agenticNotebooklm.md.
// GPT-3.5 jumps from 48.1% → 95.1% on coding benchmarks with agentic refinement.
// Key practices: cap iterations, use explicit approval criteria, optionally
// insert human as evaluator.

export interface ReflectionConfig {
  enabled: boolean;
  maxIterations: number;        // Default: 3
  criticPrompt: string;         // Custom critic system prompt
  approvalKeyword: string;      // Default: "APPROVED"
  requireHumanApproval: boolean; // For high-stakes outputs
}

export interface ReflectionIteration {
  iteration: number;
  output: string;
  critique: string;
  approved: boolean;
  timestamp: Date;
}

export interface ReflectionResult {
  output: string;
  iterations: ReflectionIteration[];
  approved: boolean;
  totalIterations: number;
}

/**
 * Run a reflection loop: Critic evaluates, Generator revises until approved
 * or max iterations reached.
 */
export async function runReflectionLoop(
  initialOutput: string,
  goal: string,
  config: ReflectionConfig,
  runId: string
): Promise<ReflectionResult> {
  const iterations: ReflectionIteration[] = [];
  let currentOutput = initialOutput;
  let approved = false;
  let iteration = 0;

  emitEvent(runId, {
    type: "reflection",
    message: `Reflection loop started (max ${config.maxIterations} iterations, approval keyword: "${config.approvalKeyword}")`,
    data: { phase: "start", maxIterations: config.maxIterations },
  });

  while (iteration < config.maxIterations && !approved) {
    // Critic evaluates
    emitEvent(runId, {
      type: "reflection",
      message: `Reflection iteration ${iteration + 1}: Critic is evaluating...`,
      step: iteration,
      data: { phase: "critique_start", iteration },
    });

    const critique = await critiqueOutput(currentOutput, goal, config);

    emitEvent(runId, {
      type: "reflection",
      message: `Critique received: ${critique.substring(0, 200)}`,
      step: iteration,
      data: { phase: "critique_done", iteration, critique: critique.substring(0, 300) },
    });

    approved = critique.toUpperCase().includes(config.approvalKeyword.toUpperCase());

    iterations.push({
      iteration,
      output: currentOutput.substring(0, 2000),
      critique: critique.substring(0, 2000),
      approved,
      timestamp: new Date(),
    });

    // Persist to DB
    try {
      const { db } = await import("@/lib/db");
      await db.reflectionIteration.create({
        data: {
          runId,
          iteration,
          output: currentOutput.substring(0, 5000),
          critique: critique.substring(0, 5000),
          approved,
        },
      });
    } catch {
      // Non-critical: reflection data already emitted via events
    }

    if (!approved && iteration < config.maxIterations - 1) {
      // Generator revises
      emitEvent(runId, {
        type: "reflection",
        message: `Reflection iteration ${iteration + 1}: Revising output...`,
        step: iteration,
        data: { phase: "revision_start", iteration },
      });

      currentOutput = await reviseOutput(currentOutput, critique, goal, config);

      emitEvent(runId, {
        type: "reflection",
        message: `Revised output generated (${currentOutput.length} chars)`,
        step: iteration,
        data: { phase: "revision_done", iteration },
      });
    }

    iteration++;
  }

  const result: ReflectionResult = {
    output: currentOutput,
    iterations,
    approved,
    totalIterations: iteration,
  };

  emitEvent(runId, {
    type: "reflection",
    message: approved
      ? `Output approved after ${iteration} iteration(s)`
      : `Reflection loop exhausted (${iteration} iterations, not approved)`,
    data: { phase: "end", approved, totalIterations: iteration },
  });

  return result;
}

// ============ Critic & Generator Functions ============

async function critiqueOutput(
  output: string,
  goal: string,
  config: ReflectionConfig
): Promise<string> {
  const zai = await getZAI();
  const response = await zai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          config.criticPrompt ||
          `You are a quality critic. Evaluate the output against the goal. If the output is satisfactory and meets all requirements, respond with "${config.approvalKeyword}". Otherwise, provide specific, actionable feedback for improvement. Be thorough but constructive.`,
      },
      {
        role: "user",
        content: `Goal: ${goal}\n\nOutput to evaluate:\n${output}`,
      },
    ],
    thinking: { type: "disabled" },
  });
  return response.choices[0]?.message?.content ?? "";
}

async function reviseOutput(
  output: string,
  critique: string,
  goal: string,
  _config: ReflectionConfig
): Promise<string> {
  const zai = await getZAI();
  const response = await zai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an expert generator. Revise the output based on the critique provided. Address every point of feedback. Produce a complete, improved version.",
      },
      {
        role: "user",
        content: `Goal: ${goal}\n\nCurrent output:\n${output}\n\nCritique:\n${critique}\n\nPlease provide a revised output that addresses all feedback.`,
      },
    ],
    thinking: { type: "disabled" },
  });
  return response.choices[0]?.message?.content ?? output;
}
