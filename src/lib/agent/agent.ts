import { plan } from "./planner";
import { execute } from "./tools";
import { evaluate } from "./evaluator";
import { addMemoryEntry, getMemory, clearMemory } from "./memory";
import { AgentAction, AgentConfig, AgentEvent, AgentTool } from "./types";
import { db } from "@/lib/db";

// ============ Event System (with cleanup) ============

const eventListeners = new Map<string, ((event: AgentEvent) => void)[]>();

export function addEventListener(
  runId: string,
  listener: (event: AgentEvent) => void
): void {
  const listeners = eventListeners.get(runId) || [];
  listeners.push(listener);
  eventListeners.set(runId, listeners);
}

export function removeEventListener(
  runId: string,
  listener: (event: AgentEvent) => void
): void {
  const listeners = eventListeners.get(runId) || [];
  const updated = listeners.filter((l) => l !== listener);
  if (updated.length === 0) {
    eventListeners.delete(runId); // Clean up empty listener arrays
  } else {
    eventListeners.set(runId, updated);
  }
}

export function emitEvent(runId: string, event: AgentEvent): void {
  const listeners = eventListeners.get(runId) || [];
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error(`Event listener error for run ${runId}:`, error);
    }
  });
}

// ============ Active Runs (with concurrency control) ============

const activeRuns = new Set<string>();
const MAX_CONCURRENT_RUNS = 5;

interface QueuedRun {
  runId: string;
  config: AgentConfig;
  resolve: () => void;
  reject: (error: Error) => void;
}

const runQueue: QueuedRun[] = [];
let activeRunCount = 0;

export function stopRun(runId: string): void {
  activeRuns.delete(runId);
  emitEvent(runId, { type: "done", message: "Run stopped by user" });
}

export function isRunActive(runId: string): boolean {
  return activeRuns.has(runId);
}

// ============ Run Cleanup (fixes memory leaks) ============

function cleanupRun(runId: string): void {
  activeRuns.delete(runId);
  eventListeners.delete(runId); // FIX C01: Clean up event listeners
  clearMemory(runId);           // FIX C03: Clean up run memory
}

// ============ Step Execution ============

export async function runStep(
  runId: string,
  goal: string,
  tools: AgentTool[],
  personality: string,
  currentStep: number,
  maxSteps: number
): Promise<{ done: boolean; step: number }> {
  const context = getMemory(runId);
  const stepStartTime = Date.now();

  // Emit thinking event
  emitEvent(runId, {
    type: "thinking",
    message: `Planning step ${currentStep + 1}...`,
    step: currentStep,
  });

  // Plan the next action
  const action: AgentAction = await plan(goal, context, tools, personality);

  // Emit plan event
  emitEvent(runId, {
    type: "plan",
    message: `Decided to use ${action.tool}: ${action.input}`,
    step: currentStep,
    data: { tool: action.tool, input: action.input },
  });

  // Check if we should stop (kill switch)
  if (!activeRuns.has(runId)) {
    return { done: true, step: currentStep };
  }

  // Emit action event
  emitEvent(runId, {
    type: "action",
    message: `Executing ${action.tool}...`,
    step: currentStep,
    data: { tool: action.tool, input: action.input },
  });

  // Execute the action
  let result: string;
  try {
    result = await execute(action);
  } catch (error) {
    result = `Tool execution error: ${error instanceof Error ? error.message : String(error)}`;
    emitEvent(runId, {
      type: "error",
      message: result,
      step: currentStep,
    });
  }

  // Store in memory
  addMemoryEntry(runId, currentStep, action, result);

  // Persist step to database (with error recovery)
  const stepLatencyMs = Date.now() - stepStartTime;
  try {
    await db.step.create({
      data: {
        runId,
        stepNum: currentStep,
        tool: action.tool,
        input: action.input.substring(0, 10000), // Limit input length
        result: result.substring(0, 5000),
        latencyMs: stepLatencyMs,
      },
    });
  } catch (error) {
    console.error("Failed to persist step:", error);
    // Don't silently swallow — emit error event
    emitEvent(runId, {
      type: "error",
      message: "Failed to save step to database",
      step: currentStep,
    });
  }

  // Emit result event
  emitEvent(runId, {
    type: "result",
    message: result,
    step: currentStep,
    data: { tool: action.tool, input: action.input, result, latencyMs: stepLatencyMs },
  });

  // Evaluate if goal is complete
  const done = await evaluate(goal, getMemory(runId));

  if (done) {
    const finalResult = action.tool === "finish"
      ? action.input
      : result;

    emitEvent(runId, {
      type: "done",
      message: "Goal accomplished!",
      step: currentStep,
    });
    cleanupRun(runId);

    // Update run status in database
    try {
      await db.agentRun.update({
        where: { id: runId },
        data: { status: "completed", result: finalResult.substring(0, 10000) },
      });
    } catch (error) {
      console.error("Failed to update run status:", error);
    }

    return { done: true, step: currentStep };
  }

  // Safety: stop if max steps reached
  if (currentStep + 1 >= maxSteps) {
    emitEvent(runId, {
      type: "done",
      message: "Maximum steps reached. Task may be incomplete.",
      step: currentStep,
    });
    cleanupRun(runId);

    try {
      await db.agentRun.update({
        where: { id: runId },
        data: { status: "completed", result: "Max steps reached. Task may be incomplete." },
      });
    } catch (error) {
      console.error("Failed to update run status:", error);
    }

    return { done: true, step: currentStep };
  }

  return { done: false, step: currentStep + 1 };
}

// ============ Full Agent Loop (with concurrency + try/finally cleanup) ============

export async function runAgent(
  runId: string,
  config: AgentConfig
): Promise<void> {
  // Concurrency control: queue if at limit
  if (activeRunCount >= MAX_CONCURRENT_RUNS) {
    await new Promise<void>((resolve, reject) => {
      runQueue.push({ runId, config, resolve, reject });
    });
  }

  activeRunCount++;
  activeRuns.add(runId);

  try {
    let step = 0;

    emitEvent(runId, {
      type: "status",
      message: `Agent "${config.name}" starting...`,
    });

    while (step < config.loop.maxSteps && activeRuns.has(runId)) {
      const { done, step: nextStep } = await runStep(
        runId,
        config.goal,
        config.tools,
        config.personality || "helpful assistant",
        step,
        config.loop.maxSteps
      );

      if (done) break;
      step = nextStep;

      // Small delay between steps for safety and UX
      if (config.loop.autoRun) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        break;
      }
    }

    // If run was stopped or exhausted without "done" event
    if (activeRuns.has(runId)) {
      cleanupRun(runId);
      try {
        await db.agentRun.update({
          where: { id: runId },
          data: { status: "stopped" },
        });
      } catch (error) {
        console.error("Failed to update run status:", error);
      }
    }
  } catch (error) {
    // FIX C02: Always cleanup, even on unexpected errors
    cleanupRun(runId);
    emitEvent(runId, {
      type: "error",
      message: `Agent crashed: ${error instanceof Error ? error.message : String(error)}`,
    });
    try {
      await db.agentRun.update({
        where: { id: runId },
        data: { status: "failed", result: error instanceof Error ? error.message : "Unknown error" },
      });
    } catch (dbError) {
      console.error("Failed to update failed run status:", dbError);
    }
  } finally {
    activeRunCount--;
    processQueue();
  }
}

// Process queued runs when slots open up
function processQueue(): void {
  while (activeRunCount < MAX_CONCURRENT_RUNS && runQueue.length > 0) {
    const queued = runQueue.shift();
    if (queued) {
      // Run in background — don't block the queue processor
      runAgent(queued.runId, queued.config)
        .then(() => queued.resolve())
        .catch((error) => queued.reject(error instanceof Error ? error : new Error(String(error))));
    }
  }
}

// ============ Utility ============

export function getRunResult(runId: string): string {
  const memory = getMemory(runId);
  if (memory.length === 0) return "No results";

  const lastEntry = memory[memory.length - 1];
  if (lastEntry.action.tool === "finish") {
    return lastEntry.result;
  }

  return memory
    .map(
      (entry) =>
        `**Step ${entry.step + 1}** (${entry.action.tool}): ${entry.action.input}\n${entry.result}`
    )
    .join("\n\n---\n\n");
}
