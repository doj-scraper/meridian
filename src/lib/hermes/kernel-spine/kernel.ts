/**
 * @hermes/kernel-spine — The Hermes Kernel
 *
 * The single deterministic transition loop.
 *
 * KERNEL INVERSION IMPLEMENTED:
 *   BEFORE: action → mutate state → emit logs
 *   AFTER:  action → emit event → reducer applies state
 *
 * The kernel transition loop:
 * 1. Compute frontier (delegates to @hermes/frontier)
 * 2. Select event from frontier or accept agent proposal
 * 3. Execute the event (side-effect boundary)
 * 4. Emit result event with parent pointing to executed event
 * 5. Reducer derives new state
 *
 * KEY INVARIANTS:
 * - The kernel is the ONLY code that can cause state transitions
 * - Agents propose, the kernel disposes
 * - Every transition is recorded in the event log
 * - State is always derivable from the event log
 * - The kernel is deterministic: same log → same state, always
 */

import type { BrandedRunId, BrandedAgentId, BrandedEventId } from "../test-harness/brands";
import type { HermesEvent } from "../event-dsl/types";
import {
  createGenesisEvent,
  createSystemEvent,
  createDecisionEvent,
  createExecutionEvent,
  createTelemetryEvent,
  createAgentId,
} from "../event-dsl/constructors";
import { sha256 } from "../event-dsl/hashing";
import { buildDepthContext, computeCausalDepth } from "../causal-core-lock/graph-builder";

import type {
  HermesRunConfig,
  HermesState,
  KernelTransition,
  AgentProposal,
  RunStatus,
} from "./types";
import { getEventStore } from "./event-store";
import { reduceEvents, reduceFromCheckpoint, createInitialState, computeStateHash } from "./reducer";
import { getCheckpointManager } from "./checkpoint";
import type { IAgentProposer, ProposerContext } from "./proposer";
import { createProposer } from "./proposer";

// ═══════════════════════════════════════════════════════════════
// Kernel State
// ═══════════════════════════════════════════════════════════════

interface KernelRunContext {
  config: HermesRunConfig;
  status: RunStatus;
  proposers: Map<string, IAgentProposer>;
  currentState: HermesState;
  transitionCount: number;
  lastTransitionAt: number;
  abortController: AbortController;
}

// ═══════════════════════════════════════════════════════════════
// Hermes Kernel
// ═══════════════════════════════════════════════════════════════

export class HermesKernel {
  private readonly runs = new Map<string, KernelRunContext>();
  private readonly store = getEventStore();
  private readonly checkpointManager = getCheckpointManager();

  // ═══════════════════════════════════════════════════════════
  // Run Lifecycle
  // ═══════════════════════════════════════════════════════════

  /**
   * Initialize a new Hermes run.
   * Creates the genesis event and sets up the run context.
   */
  async initializeRun(config: HermesRunConfig): Promise<BrandedEventId> {
    const runIdStr = String(config.runId);

    // Create genesis event
    const genesisEvent = createGenesisEvent(config.runId, {
      subtype: "run_start",
      message: `Run initialized with goal: ${config.goal}`,
      details: {
        goal: config.goal,
        maxTransitions: config.maxTransitions,
        maxConcurrency: config.maxConcurrency,
      },
    });

    // Append genesis to event store
    await this.store.append(genesisEvent);

    // Create run context
    const initialState = createInitialState();

    const context: KernelRunContext = {
      config,
      status: "running",
      proposers: new Map(),
      currentState: reduceEvents([genesisEvent]),
      transitionCount: 0,
      lastTransitionAt: Date.now(),
      abortController: new AbortController(),
    };

    this.runs.set(runIdStr, context);

    return genesisEvent.eventId;
  }

  /**
   * Register an agent proposer for a run.
   */
  registerProposer(
    runId: BrandedRunId,
    proposer: IAgentProposer
  ): void {
    const ctx = this.runs.get(String(runId));
    if (!ctx) throw new Error(`Run ${String(runId)} not found`);

    ctx.proposers.set(String(proposer.config.agentId), proposer);

    // Update state with agent registration
    const agentRegEvent = createSystemEvent(
      [this.getLatestEventId(ctx)],
      runId,
      {
        subtype: "agent_registered",
        message: `Agent ${proposer.config.name} registered`,
        details: {
          name: proposer.config.name,
          role: proposer.config.role,
          tools: proposer.config.tools,
        },
      },
      this.getParentDepths(ctx, [this.getLatestEventId(ctx)])
    );

    this.store.append(agentRegEvent);
    ctx.currentState = reduceFromCheckpoint(ctx.currentState, [agentRegEvent]);
  }

  /**
   * Run the kernel transition loop until completion.
   * This is the main execution entry point.
   */
  async run(runId: BrandedRunId): Promise<void> {
    const ctx = this.runs.get(String(runId));
    if (!ctx) throw new Error(`Run ${String(runId)} not found`);

    try {
      while (
        ctx.status === "running" &&
        ctx.transitionCount < ctx.config.maxTransitions &&
        !ctx.abortController.signal.aborted
      ) {
        const transition = await this.executeTransition(runId, ctx);

        if (!transition.success) {
          // Transition failed — emit error and mark run as failed
          if (transition.error) {
            await this.emitSystemEvent(ctx, "run_error", transition.error);
          }
          ctx.status = "failed";
          break;
        }

        ctx.transitionCount++;

        // Checkpoint at intervals
        if (ctx.transitionCount % ctx.config.checkpointInterval === 0) {
          this.createCheckpoint(runId, ctx);
        }

        // If the run completed during the transition, stop the loop
        if ((ctx.status as RunStatus) === "completed") {
          break;
        }

        // Delay between transitions for safety
        if (ctx.config.transitionDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, ctx.config.transitionDelayMs));
        }
      }

      // If the loop ended naturally (max transitions) and status is still running,
      // mark as completed
      if (ctx.status === "running") {
        await this.emitSystemEvent(ctx, "run_complete", `Run completed after ${ctx.transitionCount} transitions (max reached)`);
        ctx.status = "completed";
      }
    } catch (error) {
      // Emit error event
      await this.emitSystemEvent(ctx, "run_error", `Kernel error: ${error instanceof Error ? error.message : String(error)}`);
      ctx.status = "failed";
    }
  }

  /**
   * Stop a running kernel.
   */
  stop(runId: BrandedRunId): void {
    const ctx = this.runs.get(String(runId));
    if (!ctx) return;

    ctx.abortController.abort();
    ctx.status = "stopped";
  }

  /**
   * Get the current state for a run.
   */
  getState(runId: BrandedRunId): HermesState | undefined {
    return this.runs.get(String(runId))?.currentState;
  }

  /**
   * Get the current status of a run.
   */
  getStatus(runId: BrandedRunId): RunStatus | undefined {
    return this.runs.get(String(runId))?.status;
  }

  // ═══════════════════════════════════════════════════════════
  // Transition Loop
  // ═══════════════════════════════════════════════════════════

  /**
   * Execute a single kernel transition.
   *
   * This is the fundamental unit of execution:
   * 1. Compute frontier (which events can happen next)
   * 2. Select a proposer (agent)
   * 3. Get proposal from proposer
   * 4. Execute the proposed action (side-effect boundary)
   * 5. Emit result events
   * 6. Derive new state via reducer
   */
  private async executeTransition(
    runId: BrandedRunId,
    ctx: KernelRunContext
  ): Promise<KernelTransition> {
    const transitionStart = Date.now();
    const latestEventId = this.getLatestEventId(ctx);
    const parentDepths = this.getParentDepths(ctx, [latestEventId]);

    try {
      // 1. Select a proposer (round-robin for now)
      let proposer = this.selectProposer(ctx);
      if (!proposer) {
        // No proposers registered — create a default one from the run config
        const defaultAgentId = createAgentId(`default-${String(runId)}`);
        proposer = createProposer({
          agentId: defaultAgentId,
          name: "Hermes Agent",
          role: "general",
          tools: ["search", "write", "code", "browser"],
          personality: "helpful assistant that completes tasks efficiently",
          goal: ctx.config.goal,
          maxProposals: ctx.config.maxTransitions,
        });
        // Register it so future transitions can use it
        ctx.proposers.set(String(defaultAgentId), proposer);
        await this.emitSystemEvent(ctx, "agent_registered", `Auto-created default agent for run`);
      }

      // 2. Build proposer context (read-only view)
      const proposerContext = this.buildProposerContext(runId, ctx);

      // 3. Get proposal
      const proposal = await proposer.propose(proposerContext);

      // 4. Emit decision event
      const decisionEvent = createDecisionEvent(
        [latestEventId],
        runId,
        proposal.agentId,
        {
          decision: proposal.actionType,
          reasoning: proposal.justification,
          confidence: proposal.confidence,
        },
        parentDepths,
        proposal.action.type === "branch" ? (proposal.action as { branchLabel: string }).branchLabel : undefined
      );
      await this.store.append(decisionEvent);

      // 5. Execute the proposal (side-effect boundary)
      const executionResult = await this.executeProposal(proposal, ctx);

      // 6. Emit execution event
      const executionEvent = createExecutionEvent(
        [decisionEvent.eventId],
        runId,
        proposal.agentId,
        {
          tool: this.getToolName(proposal),
          input: this.getToolInput(proposal),
          output: executionResult.output,
          success: executionResult.success,
          durationMs: executionResult.durationMs,
        },
        this.getParentDepths(ctx, [decisionEvent.eventId])
      );
      await this.store.append(executionEvent);

      // 7. Derive new state
      const newEvents = [decisionEvent, executionEvent];
      ctx.currentState = reduceFromCheckpoint(ctx.currentState, newEvents);

      // 8. Check if goal achieved (finish action)
      if (proposal.actionType === "finish") {
        await this.emitSystemEvent(ctx, "run_complete", executionResult.output);
        ctx.status = "completed";
      }

      ctx.lastTransitionAt = Date.now();

      return this.buildTransition(ctx, latestEventId, transitionStart, true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // Emit error event and update state
      try {
        await this.emitSystemEvent(ctx, "run_error", errorMsg);
      } catch {
        // If we can't even emit the error event, just log it
        console.error(`[Hermes] Failed to emit error event for run ${String(runId)}:`, errorMsg);
      }
      return this.buildTransition(ctx, latestEventId, transitionStart, false, errorMsg);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Proposal Execution (Side-Effect Boundary)
  // ═══════════════════════════════════════════════════════════

  /**
   * Execute a proposal's action.
   * This is the ONLY place where side effects (tool execution)
   * are allowed in the Hermes architecture.
   */
  private async executeProposal(
    proposal: AgentProposal,
    ctx: KernelRunContext
  ): Promise<{ output: string; success: boolean; durationMs: number }> {
    const start = Date.now();

    try {
      switch (proposal.actionType as any) {
        case "finish": {
          const finishAction = proposal.action as { result: string };
          return {
            output: finishAction.result,
            success: true,
            durationMs: Date.now() - start,
          };
        }

        case "use_tool":
        case "search":
        case "write":
        case "code":
        case "browser": {
          const toolAction = proposal.action as { tool: string; input: string };
          // Use the tool from the action, or fall back to the actionType itself
          const toolName = toolAction.tool || proposal.actionType;
          const toolInput = toolAction.input || "";
          // Delegate to existing tool execution infrastructure
          const result = await this.executeToolAction(toolName, toolInput);
          return {
            output: result,
            success: true,
            durationMs: Date.now() - start,
          };
        }

        case "wait":
          return {
            output: "Waiting for specified events",
            success: true,
            durationMs: Date.now() - start,
          };

        case "delegate":
          return {
            output: "Delegation requested (not yet implemented)",
            success: true,
            durationMs: Date.now() - start,
          };

        default:
          return {
            output: `Unknown action type: ${proposal.actionType}`,
            success: false,
            durationMs: Date.now() - start,
          };
      }
    } catch (error) {
      return {
        output: `Execution error: ${error instanceof Error ? error.message : String(error)}`,
        success: false,
        durationMs: Date.now() - start,
      };
    }
  }

  /**
   * Execute a tool action using the existing tool infrastructure.
   * This is the bridge between Hermes kernel and the V1 tool system.
   */
  private async executeToolAction(tool: string, input: string): Promise<string> {
    // Import from existing V1 tool system — bridge pattern
    const { execute } = await import("@/lib/agent/tools");
    try {
      return await execute({ tool: tool as "search" | "write" | "code" | "browser" | "finish", input });
    } catch (error) {
      return `Tool execution error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Helper Methods
  // ═══════════════════════════════════════════════════════════

  private selectProposer(ctx: KernelRunContext): IAgentProposer | null {
    const proposers = Array.from(ctx.proposers.values());
    if (proposers.length === 0) return null;
    // Round-robin selection
    return proposers[ctx.transitionCount % proposers.length];
  }

  private buildProposerContext(runId: BrandedRunId, ctx: KernelRunContext): ProposerContext {
    const events = this.store.getByRunIdSync(String(runId));
    return {
      runId,
      visitedEventIds: new Set(events.map((e) => String(e.eventId))),
      frontierEventIds: new Set(), // Will be populated by frontier solver
      recentEvents: events.slice(-10),
      availableTools: Array.from(ctx.proposers.values()).flatMap((p) => p.config.tools),
      proposalCount: ctx.transitionCount,
    };
  }

  private getLatestEventId(ctx: KernelRunContext): BrandedEventId {
    // Get the latest event from the run's event list
    const events = this.store.getByRunIdSync(String(ctx.config.runId));
    if (events.length === 0) {
      throw new Error("No events in run — genesis event missing");
    }
    return events[events.length - 1].eventId;
  }

  private getParentDepths(ctx: KernelRunContext, parentIds: BrandedEventId[]): number[] {
    return parentIds.map((pid) => {
      const event = this.store.getSync(String(pid));
      return event?.causalDepth ?? 0;
    });
  }

  private async emitSystemEvent(
    ctx: KernelRunContext,
    subtype: string,
    message: string
  ): Promise<void> {
    const latestId = this.getLatestEventId(ctx);
    const parentDepths = this.getParentDepths(ctx, [latestId]);

    const event = createSystemEvent(
      [latestId],
      ctx.config.runId,
      { subtype: subtype as "run_start", message },
      parentDepths
    );

    await this.store.append(event);
    ctx.currentState = reduceFromCheckpoint(ctx.currentState, [event]);
  }

  private async emitTelemetryEvent(
    ctx: KernelRunContext,
    metric: string,
    value: number
  ): Promise<void> {
    const latestId = this.getLatestEventId(ctx);
    const parentDepths = this.getParentDepths(ctx, [latestId]);

    const event = createTelemetryEvent(
      [latestId],
      ctx.config.runId,
      { metric, value },
      parentDepths
    );

    await this.store.append(event);
    ctx.currentState = reduceFromCheckpoint(ctx.currentState, [event]);
  }

  private async getRecentEvents(ctx: KernelRunContext, count: number): Promise<HermesEvent[]> {
    const events = this.store.getByRunIdSync(String(ctx.config.runId));
    return events.slice(-count);
  }

  private createCheckpoint(runId: BrandedRunId, ctx: KernelRunContext): void {
    const latestId = String(this.getLatestEventId(ctx));
    this.checkpointManager.createCheckpoint(
      String(runId),
      latestId,
      ctx.transitionCount,
      ctx.currentState
    );
  }

  private buildTransition(
    ctx: KernelRunContext,
    executedEventId: BrandedEventId,
    startedAt: number,
    success: boolean,
    error?: string
  ): KernelTransition {
    return {
      transitionId: `txn_${ctx.transitionCount}`,
      runId: ctx.config.runId,
      executedEventId,
      eventType: "DECISION",
      producedEventIds: [],
      stateHashBefore: computeStateHash(ctx.currentState),
      stateHashAfter: computeStateHash(ctx.currentState),
      durationMs: Date.now() - startedAt,
      success,
      error,
      startedAt,
      completedAt: Date.now(),
    };
  }

  private getToolName(proposal: AgentProposal): string {
    const action = proposal.action as unknown as Record<string, unknown>;
    return String(action.tool ?? "unknown");
  }

  private getToolInput(proposal: AgentProposal): string {
    const action = proposal.action as unknown as Record<string, unknown>;
    return String(action.input ?? "");
  }
}

// ═══════════════════════════════════════════════════════════════
// Singleton Kernel
// ═══════════════════════════════════════════════════════════════

let kernelInstance: HermesKernel | null = null;

export function getKernel(): HermesKernel {
  if (!kernelInstance) {
    kernelInstance = new HermesKernel();
  }
  return kernelInstance;
}
