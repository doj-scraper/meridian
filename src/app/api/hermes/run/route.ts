/**
 * POST /api/hermes/run
 *
 * Start a new Hermes causal execution run.
 * Creates the event log, initializes the kernel, and begins
 * the deterministic transition loop.
 */

import { NextRequest, NextResponse } from "next/server";
import { getKernel } from "@/lib/hermes/kernel-spine";
import { createRunId, createAgentId } from "@/lib/hermes/event-dsl/constructors";
import { createProposer } from "@/lib/hermes/kernel-spine/proposer";
import type { HermesRunConfig } from "@/lib/hermes/kernel-spine/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goal, agentId, agentName, agentRole, agentTools, maxTransitions } = body;

    if (!goal) {
      return NextResponse.json(
        { error: "Goal is required" },
        { status: 400 }
      );
    }

    const kernel = getKernel();
    const runId = createRunId(`hermes-${Date.now()}`);

    const config: HermesRunConfig = {
      goal,
      maxTransitions: maxTransitions ?? 10,
      maxConcurrency: 3,
      autoAdvance: true,
      transitionDelayMs: 500,
      checkpointInterval: 5,
      runId,
    };

    // Initialize the run
    await kernel.initializeRun(config);

    // Register agent proposer if provided
    if (agentId && agentName) {
      const proposer = createProposer({
        agentId: createAgentId(agentId),
        name: agentName,
        role: agentRole ?? "general",
        tools: agentTools ?? ["search", "write", "code", "browser"],
        personality: "helpful assistant",
        goal,
        maxProposals: maxTransitions ?? 10,
      });
      kernel.registerProposer(runId, proposer);
    }

    // Start the run in the background (non-blocking)
    kernel.run(runId).catch((error) => {
      console.error(`Hermes run ${String(runId)} failed:`, error);
    });

    return NextResponse.json({
      runId: String(runId),
      status: "running",
      goal,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
