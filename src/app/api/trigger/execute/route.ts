import { db } from "@/lib/db";
import { runAgent, emitEvent } from "@/lib/agent/agent";
import { AgentConfig, AgentTool } from "@/lib/agent/types";
import { NextRequest, NextResponse } from "next/server";

// POST /api/trigger/execute - Manually execute a trigger
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { triggerId } = body;

    if (!triggerId) {
      return NextResponse.json(
        { error: "triggerId is required" },
        { status: 400 }
      );
    }

    const trigger = await db.agentTrigger.findUnique({
      where: { id: triggerId },
    });

    if (!trigger) {
      return NextResponse.json(
        { error: "Trigger not found" },
        { status: 404 }
      );
    }

    if (!trigger.enabled) {
      return NextResponse.json(
        { error: "Trigger is disabled" },
        { status: 400 }
      );
    }

    // Get the associated agent
    const agent = await db.agent.findUnique({
      where: { id: trigger.agentId },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Associated agent not found" },
        { status: 404 }
      );
    }

    // Build agent config
    const config: AgentConfig = {
      id: agent.id,
      name: agent.name,
      goal: agent.goal,
      personality: agent.personality || "helpful assistant",
      tools: agent.tools.split(",") as AgentTool[],
      memory: {
        shortTerm: agent.shortTermMemory,
        longTerm: agent.longTermMemory,
      },
      loop: {
        maxSteps: agent.maxSteps,
        autoRun: agent.autoRun,
      },
      outputs: {
        format: (agent.outputFormat as "text" | "json" | "markdown") || "markdown",
      },
      role: (agent.role as AgentConfig["role"]) || "general",
      model: agent.model || "gemini-2.5-pro",
      orchestrationMode: (agent.orchestrationMode as AgentConfig["orchestrationMode"]) || "single",
      reflectionEnabled: agent.reflectionEnabled || false,
      reflectionMaxIter: agent.reflectionMaxIter || 3,
      reflectionCriteria: agent.reflectionCriteria || "APPROVED",
      maxConcurrency: agent.maxConcurrency || 3,
    };

    // Create a run record
    const run = await db.agentRun.create({
      data: {
        agentId: agent.id,
        status: "running",
      },
    });

    // Update trigger last run
    await db.agentTrigger.update({
      where: { id: triggerId },
      data: {
        lastRunAt: new Date(),
        runCount: { increment: 1 },
      },
    });

    // Run the agent asynchronously
    runAgent(run.id, config).catch(async (error) => {
      console.error("Trigger execute agent run error:", error);
      emitEvent(run.id, { type: "error", message: `Agent error: ${error.message}` });
      emitEvent(run.id, { type: "done", message: "Run failed" });
      await db.agentRun.update({
        where: { id: run.id },
        data: { status: "failed" },
      }).catch(() => {});
    });

    return NextResponse.json({
      runId: run.id,
      agentId: agent.id,
      triggerId: trigger.id,
      triggerType: trigger.type,
      status: "running",
    });
  } catch (error) {
    console.error("Execute trigger error:", error);
    return NextResponse.json(
      { error: "Failed to execute trigger" },
      { status: 500 }
    );
  }
}
