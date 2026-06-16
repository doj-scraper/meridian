import { EventEmitter } from "events";
import { AgentConfig, AgentEvent, AgentTool, OrchestrationMode } from "./types";
import { getEffectivePersonality } from "./roles";
import { runReflectionLoop, ReflectionConfig } from "./reflection";
import { addEventListener, emitEvent, isRunActive } from "./agent";
import { plan } from "./planner";
import { execute } from "./tools";
import { evaluate } from "./evaluator";
import { addMemoryEntry, getMemory } from "./memory";
import { db } from "@/lib/db";
import { getZAI } from "./zai-client";

// ============ Orchestration Types ============

export type TerminationCondition =
  | { type: "max_steps"; value: number }
  | { type: "text_mention"; text: string }
  | { type: "max_messages"; value: number }
  | { type: "composite"; conditions: TerminationCondition[]; operator: "and" | "or" };

export interface TeamConfig {
  id: string;
  name: string;
  mode: OrchestrationMode;
  agents: AgentConfig[];
  termination: TerminationCondition;
  maxConcurrency?: number;
  sharedContext?: boolean;
}

export interface GroupChatMessage {
  role: "user" | "assistant";
  content: string;
  source: string;
}

export interface OrchestrationResult {
  output: string;
  agentResults: Record<string, string>;
  totalSteps: number;
  mode: OrchestrationMode;
}

// ============ Semaphore for concurrency control ============

class Semaphore {
  private queue: (() => void)[] = [];
  private running = 0;
  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++;
      return;
    }
    return new Promise<void>((resolve) => this.queue.push(resolve));
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) {
      this.running++;
      next();
    }
  }
}

// ============ Orchestrator ============

export class AgentOrchestrator extends EventEmitter {
  private activeOrchestrations = new Map<string, AbortController>();

  async run(
    team: TeamConfig,
    input: string,
    runId: string
  ): Promise<OrchestrationResult> {
    const controller = new AbortController();
    this.activeOrchestrations.set(team.id, controller);

    try {
      switch (team.mode) {
        case "single":
          return await this.runSingle(team, input, runId, controller.signal);
        case "sequential":
          return await this.runSequential(team, input, runId, controller.signal);
        case "group":
          return await this.runGroup(team, input, runId, controller.signal);
        case "hierarchical":
          return await this.runHierarchical(team, input, runId, controller.signal);
        case "parallel":
          return await this.runParallel(team, input, runId, controller.signal);
        default:
          return await this.runSingle(team, input, runId, controller.signal);
      }
    } finally {
      this.activeOrchestrations.delete(team.id);
    }
  }

  stop(teamId: string): void {
    this.activeOrchestrations.get(teamId)?.abort();
  }

  // ── Single mode: run first agent only (backward-compatible) ──

  private async runSingle(
    team: TeamConfig,
    input: string,
    runId: string,
    signal: AbortSignal
  ): Promise<OrchestrationResult> {
    const agent = team.agents[0];
    const output = await this.executeAgentLoop(agent, input, runId, signal, 0);

    return {
      output,
      agentResults: { [agent.name]: output },
      totalSteps: 1,
      mode: "single",
    };
  }

  // ── Sequential: A → B → C, output handoff between stages ──

  private async runSequential(
    team: TeamConfig,
    input: string,
    runId: string,
    signal: AbortSignal
  ): Promise<OrchestrationResult> {
    const agentResults: Record<string, string> = {};
    let currentInput = input;
    let totalSteps = 0;

    for (let i = 0; i < team.agents.length; i++) {
      if (signal.aborted) throw new Error("Orchestration aborted");

      const agent = team.agents[i];
      const nextAgent = team.agents[i + 1];

      // Emit handoff event
      if (i > 0) {
        emitEvent(runId, {
          type: "handoff",
          message: `Passing output from ${team.agents[i - 1].name} to ${agent.name}`,
          step: i,
          data: {
            from: team.agents[i - 1].name,
            to: agent.name,
            preview: currentInput.substring(0, 200),
          },
        });
      }

      emitEvent(runId, {
        type: "status",
        message: `Sequential step ${i + 1}/${team.agents.length}: Running ${agent.name}`,
        step: i,
        data: { agentName: agent.name, mode: "sequential", stepIndex: i },
      });

      const output = await this.executeAgentLoop(agent, currentInput, runId, signal, i);
      agentResults[agent.name] = output;
      currentInput = output;
      totalSteps++;

      // Check termination after each agent
      if (this.checkTerminationByText(currentInput, team.termination)) {
        emitEvent(runId, {
          type: "done",
          message: `Termination condition met after ${agent.name}`,
          step: i,
        });
        break;
      }
    }

    return { output: currentInput, agentResults, totalSteps, mode: "sequential" };
  }

  // ── Group Chat: shared scratchpad with turn-taking ──

  private async runGroup(
    team: TeamConfig,
    input: string,
    runId: string,
    signal: AbortSignal
  ): Promise<OrchestrationResult> {
    const history: GroupChatMessage[] = [
      { role: "user", content: input, source: "user" },
    ];
    const agentResults: Record<string, string> = {};
    let messageCount = 0;
    const maxMessages = this.getTerminationValue(team.termination, "max_messages", 20);

    while (messageCount < maxMessages) {
      if (signal.aborted) throw new Error("Orchestration aborted");

      const nextSpeaker = await this.selectNextSpeaker(team, history, messageCount);

      emitEvent(runId, {
        type: "group_message",
        message: `${nextSpeaker.name} is speaking...`,
        step: messageCount,
        data: { speaker: nextSpeaker.name, round: messageCount },
      });

      const response = await this.executeAgentTurn(
        nextSpeaker,
        history,
        runId,
        signal,
        messageCount
      );

      history.push({ role: "assistant", content: response, source: nextSpeaker.name });
      agentResults[nextSpeaker.name] = response;
      messageCount++;

      // Check text termination
      if (this.checkTerminationByText(response, team.termination)) {
        emitEvent(runId, {
          type: "done",
          message: `Termination condition met by ${nextSpeaker.name}`,
          step: messageCount,
        });
        break;
      }
    }

    const lastMessage = history[history.length - 1];
    return {
      output: lastMessage?.content ?? "",
      agentResults,
      totalSteps: messageCount,
      mode: "group",
    };
  }

  // ── Hierarchical: Manager delegates to workers, synthesizes ──

  private async runHierarchical(
    team: TeamConfig,
    input: string,
    runId: string,
    signal: AbortSignal
  ): Promise<OrchestrationResult> {
    const manager = team.agents.find((a) => a.role === "planner") ?? team.agents[0];
    const workers = team.agents.filter((a) => a.role !== "planner" && a.id !== manager.id);
    const agentResults: Record<string, string> = {};

    // Manager decomposes goal
    emitEvent(runId, {
      type: "status",
      message: `Manager ${manager.name} is decomposing the goal...`,
      step: 0,
      data: { agentName: manager.name, phase: "decomposition" },
    });

    const planOutput = await this.executeAgentLoop(
      manager,
      `Decompose this goal into sub-tasks for your team:\n${input}\n\nAvailable workers: ${workers.map((w) => `${w.name} (${w.role}, tools: ${w.tools.join(", ")})`).join(", ")}\n\nFor each sub-task, specify which worker should handle it.`,
      runId,
      signal,
      0
    );
    agentResults[manager.name] = planOutput;

    // Workers execute sub-tasks
    const workerResults: Record<string, string> = {};
    for (let i = 0; i < workers.length; i++) {
      if (signal.aborted) throw new Error("Orchestration aborted");

      const worker = workers[i];
      const task = await this.assignTask(manager, worker, planOutput, workerResults, runId, i);

      emitEvent(runId, {
        type: "handoff",
        message: `Manager ${manager.name} assigned task to ${worker.name}`,
        step: i + 1,
        data: { from: manager.name, to: worker.name, preview: task.substring(0, 200) },
      });

      const result = await this.executeAgentLoop(worker, task, runId, signal, i + 1);
      workerResults[worker.name] = result;
      agentResults[worker.name] = result;
    }

    // Manager synthesizes
    emitEvent(runId, {
      type: "status",
      message: `Manager ${manager.name} is synthesizing final output...`,
      step: workers.length + 1,
      data: { agentName: manager.name, phase: "synthesis" },
    });

    const synthesis = await this.executeAgentLoop(
      manager,
      `Synthesize the final answer from worker results.\n\nOriginal goal: ${input}\n\nPlan:\n${planOutput}\n\nWorker results:\n${Object.entries(workerResults).map(([name, result]) => `## ${name}\n${result}`).join("\n\n")}`,
      runId,
      signal,
      workers.length + 1
    );
    agentResults[manager.name] = synthesis;

    return {
      output: synthesis,
      agentResults,
      totalSteps: workers.length + 2,
      mode: "hierarchical",
    };
  }

  // ── Parallel: Fan-out with concurrency limit ──

  private async runParallel(
    team: TeamConfig,
    input: string,
    runId: string,
    signal: AbortSignal
  ): Promise<OrchestrationResult> {
    const maxConcurrency = team.maxConcurrency ?? 3;
    const agentResults: Record<string, string> = {};
    const semaphore = new Semaphore(maxConcurrency);
    let totalSteps = 0;

    emitEvent(runId, {
      type: "status",
      message: `Running ${team.agents.length} agents in parallel (max ${maxConcurrency} concurrent)`,
      step: 0,
      data: { mode: "parallel", agentCount: team.agents.length, maxConcurrency },
    });

    const results = await Promise.allSettled(
      team.agents.map(async (agent, i) => {
        await semaphore.acquire();
        try {
          if (signal.aborted) return;

          emitEvent(runId, {
            type: "status",
            message: `Parallel agent ${agent.name} starting...`,
            step: i,
            data: { agentName: agent.name, parallelIndex: i },
          });

          const result = await this.executeAgentLoop(agent, input, runId, signal, i);
          agentResults[agent.name] = result;
          totalSteps++;
          return result;
        } finally {
          semaphore.release();
        }
      })
    );

    // Merge results
    const mergedOutput = Object.entries(agentResults)
      .map(([name, result]) => `## ${name}\n${result}`)
      .join("\n\n");

    return { output: mergedOutput, agentResults, totalSteps, mode: "parallel" };
  }

  // ── Core agent loop (used by all orchestration modes) ──

  private async executeAgentLoop(
    agent: AgentConfig,
    input: string,
    runId: string,
    signal: AbortSignal,
    stepOffset: number
  ): Promise<string> {
    const personality = getEffectivePersonality(
      agent.personality || "helpful assistant",
      agent.role || "general"
    );
    const maxSteps = agent.loop.maxSteps;
    let step = 0;

    // Override the agent's goal with the input for this orchestration step
    const goal = input;

    while (step < maxSteps) {
      if (signal.aborted || !isRunActive(runId)) {
        return "Orchestration aborted";
      }

      const context = getMemory(runId);

      // Plan
      emitEvent(runId, {
        type: "thinking",
        message: `${agent.name}: Planning step ${step + 1}...`,
        step: stepOffset + step,
        data: { agentName: agent.name },
      });

      const action = await plan(goal, context, agent.tools, personality);

      // Execute
      emitEvent(runId, {
        type: "action",
        message: `${agent.name}: Executing ${action.tool}...`,
        step: stepOffset + step,
        data: { agentName: agent.name, tool: action.tool, input: action.input },
      });

      let result: string;
      try {
        result = await execute(action);
      } catch (error) {
        result = `Tool execution error: ${error instanceof Error ? error.message : String(error)}`;
        emitEvent(runId, {
          type: "error",
          message: `${agent.name}: ${result}`,
          step: stepOffset + step,
        });
      }

      // Store in memory
      addMemoryEntry(runId, step, action, result);

      // Persist step
      try {
        await db.step.create({
          data: {
            runId,
            stepNum: stepOffset + step,
            tool: action.tool,
            input: action.input.substring(0, 10000),
            result: result.substring(0, 5000),
          },
        });
      } catch {
        // Non-critical: step already emitted via events
      }

      emitEvent(runId, {
        type: "result",
        message: result,
        step: stepOffset + step,
        data: { agentName: agent.name, tool: action.tool },
      });

      // Check if done
      if (action.tool === "finish") {
        return action.input;
      }

      const done = await evaluate(goal, getMemory(runId));
      if (done) {
        return result;
      }

      step++;

      // Delay between steps
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Max steps reached — return last result
    const memory = getMemory(runId);
    return memory.length > 0 ? memory[memory.length - 1].result : "Max steps reached with no result";
  }

  // ── Agent turn for group chat ──

  private async executeAgentTurn(
    agent: AgentConfig,
    history: GroupChatMessage[],
    runId: string,
    signal: AbortSignal,
    stepOffset: number
  ): Promise<string> {
    const personality = getEffectivePersonality(
      agent.personality || "helpful assistant",
      agent.role || "general"
    );

    const conversationContext = history
      .map((msg) => `${msg.source}: ${msg.content}`)
      .join("\n\n");

    const goal = `You are ${agent.name} in a group discussion. Continue the conversation based on the group context. Your role: ${agent.role}. Your personality: ${personality}.\n\nGroup conversation so far:\n${conversationContext}\n\nProvide your response. If you believe the goal has been fully addressed and the team should stop, include the word TERMINATE in your response.`;

    const action = await plan(goal, getMemory(runId), agent.tools, personality);

    let result: string;
    try {
      result = await execute(action);
    } catch (error) {
      result = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }

    addMemoryEntry(runId, stepOffset, action, result);
    return result;
  }

  // ── Speaker selection for group chat ──

  private async selectNextSpeaker(
    team: TeamConfig,
    history: GroupChatMessage[],
    messageCount: number
  ): Promise<AgentConfig> {
    // Round-robin with LLM fallback for complex teams
    if (team.agents.length <= 3) {
      return team.agents[messageCount % team.agents.length];
    }

    // For larger teams, use LLM-based speaker selection
    try {
      const zai = await getZAI();
      const conversationPreview = history
        .slice(-6)
        .map((msg) => `${msg.source}: ${msg.content.substring(0, 100)}`)
        .join("\n");

      const agentNames = team.agents.map((a) => a.name).join(", ");

      const response = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You select the next speaker in a group chat. Available speakers: ${agentNames}. Respond with ONLY the speaker name, nothing else.`,
          },
          {
            role: "user",
            content: `Recent conversation:\n${conversationPreview}\n\nWho should speak next?`,
          },
        ],
        thinking: { type: "disabled" },
      });

      const selectedName = response.choices[0]?.message?.content?.trim();
      const selected = team.agents.find(
        (a) => a.name.toLowerCase() === selectedName?.toLowerCase()
      );
      return selected ?? team.agents[messageCount % team.agents.length];
    } catch {
      return team.agents[messageCount % team.agents.length];
    }
  }

  // ── Task assignment for hierarchical mode ──

  private async assignTask(
    manager: AgentConfig,
    worker: AgentConfig,
    plan: string,
    workerResults: Record<string, string>,
    runId: string,
    stepIndex: number
  ): Promise<string> {
    // Use LLM to extract the relevant task from the plan for this worker
    try {
      const zai = await getZAI();
      const completedWork =
        Object.keys(workerResults).length > 0
          ? `\n\nCompleted work so far:\n${Object.entries(workerResults)
              .map(([name, result]) => `${name}: ${result.substring(0, 300)}`)
              .join("\n")}`
          : "";

      const response = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a task delegator. Extract and formulate a specific task for the given worker based on the plan. Be concise and clear.",
          },
          {
            role: "user",
            content: `Plan:\n${plan.substring(0, 2000)}\n\nAssign a specific task to ${worker.name} (role: ${worker.role}, tools: ${worker.tools.join(", ")}).${completedWork}`,
          },
        ],
        thinking: { type: "disabled" },
      });

      return response.choices[0]?.message?.content ?? `Execute your part of the plan: ${plan.substring(0, 500)}`;
    } catch {
      return `Execute your part of the plan: ${plan.substring(0, 500)}`;
    }
  }

  // ── Termination helpers ──

  private checkTerminationByText(
    text: string,
    condition: TerminationCondition
  ): boolean {
    if (condition.type === "text_mention") {
      return text.toUpperCase().includes(condition.text.toUpperCase());
    }
    if (condition.type === "composite") {
      const results = condition.conditions.map((c) =>
        this.checkTerminationByText(text, c)
      );
      return condition.operator === "and"
        ? results.every(Boolean)
        : results.some(Boolean);
    }
    return false;
  }

  private getTerminationValue(
    condition: TerminationCondition,
    targetType: string,
    defaultValue: number
  ): number {
    if (condition.type === targetType) {
      return (condition as { type: string; value: number }).value;
    }
    if (condition.type === "composite") {
      for (const sub of (condition as { conditions: TerminationCondition[] }).conditions) {
        const val = this.getTerminationValue(sub, targetType, defaultValue);
        if (val !== defaultValue) return val;
      }
    }
    return defaultValue;
  }
}

// ============ Singleton Orchestrator ============

let orchestratorInstance: AgentOrchestrator | null = null;

export function getOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}

// ============ Build TeamConfig from DB Agent records ============

export async function buildTeamConfig(
  teamId: string
): Promise<TeamConfig | null> {
  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { agents: true },
  });

  if (!team || team.agents.length === 0) return null;

  const agents: AgentConfig[] = team.agents.map((a) => ({
    id: a.id,
    name: a.name,
    goal: a.goal,
    personality: a.personality || "helpful assistant",
    tools: a.tools.split(",") as AgentTool[],
    memory: { shortTerm: a.shortTermMemory, longTerm: a.longTermMemory },
    loop: { maxSteps: a.maxSteps, autoRun: a.autoRun },
    outputs: { format: (a.outputFormat as "text" | "json" | "markdown") || "markdown" },
    role: (a.role as AgentConfig["role"]) || "general",
    model: a.model || "gemini-2.5-pro",
    orchestrationMode: (a.orchestrationMode as OrchestrationMode) || "single",
    reflectionEnabled: a.reflectionEnabled,
    reflectionMaxIter: a.reflectionMaxIter,
    reflectionCriteria: a.reflectionCriteria,
    maxConcurrency: a.maxConcurrency,
  }));

  let termination: TerminationCondition;
  switch (team.terminationType) {
    case "text_mention":
      termination = { type: "text_mention", text: String(team.terminationValue) };
      break;
    case "max_messages":
      termination = { type: "max_messages", value: team.terminationValue };
      break;
    case "max_steps":
    default:
      termination = { type: "max_steps", value: team.terminationValue };
      break;
  }

  return {
    id: team.id,
    name: team.name,
    mode: (team.mode as OrchestrationMode) || "sequential",
    agents,
    termination,
    maxConcurrency: team.maxConcurrency,
    sharedContext: team.sharedContext,
  };
}

// ============ Build TeamConfig from a single agent's orchestrationMode ============

export function buildTeamFromAgent(agent: AgentConfig): TeamConfig {
  return {
    id: `single-${agent.id}`,
    name: agent.name,
    mode: agent.orchestrationMode || "single",
    agents: [agent],
    termination: { type: "max_steps", value: agent.loop.maxSteps },
    maxConcurrency: agent.maxConcurrency,
  };
}
