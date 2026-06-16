import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/agent/list - List all agents
export async function GET() {
  try {
    const agents = await db.agent.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { runs: true } },
      },
    });

    return NextResponse.json(
      agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        goal: agent.goal,
        personality: agent.personality,
        tools: agent.tools.split(","),
        shortTermMemory: agent.shortTermMemory,
        longTermMemory: agent.longTermMemory,
        maxSteps: agent.maxSteps,
        autoRun: agent.autoRun,
        outputFormat: agent.outputFormat,
        graphData: agent.graphData ? JSON.parse(agent.graphData) : null,
        runCount: agent._count.runs,
        role: agent.role,
        model: agent.model,
        orchestrationMode: agent.orchestrationMode,
        maxConcurrency: agent.maxConcurrency,
        reflectionEnabled: agent.reflectionEnabled,
        reflectionMaxIter: agent.reflectionMaxIter,
        reflectionCriteria: agent.reflectionCriteria,
        teamId: agent.teamId,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      }))
    );
  } catch (error) {
    console.error("List agents error:", error);
    return NextResponse.json(
      { error: "Failed to list agents" },
      { status: 500 }
    );
  }
}
