import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/agent/create - Create a new agent
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      goal,
      personality = "helpful assistant",
      tools = ["search", "write"],
      shortTermMemory = true,
      longTermMemory = false,
      maxSteps = 10,
      autoRun = true,
      outputFormat = "markdown",
      graphData = null,
      // V2 fields
      role = "general",
      model = "gemini-2.5-pro",
      orchestrationMode = "single",
      maxConcurrency = 3,
      reflectionEnabled = false,
      reflectionMaxIter = 3,
      reflectionCriteria = "APPROVED",
      teamId = null,
    } = body;

    if (!name || !goal) {
      return NextResponse.json(
        { error: "Name and goal are required" },
        { status: 400 }
      );
    }

    const agent = await db.agent.create({
      data: {
        name,
        goal,
        personality,
        tools: Array.isArray(tools) ? tools.join(",") : tools,
        shortTermMemory,
        longTermMemory,
        maxSteps,
        autoRun,
        outputFormat,
        graphData: graphData ? JSON.stringify(graphData) : null,
        role,
        model,
        orchestrationMode,
        maxConcurrency,
        reflectionEnabled,
        reflectionMaxIter,
        reflectionCriteria,
        teamId,
      },
    });

    return NextResponse.json({
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
      role: agent.role,
      model: agent.model,
      orchestrationMode: agent.orchestrationMode,
      maxConcurrency: agent.maxConcurrency,
      reflectionEnabled: agent.reflectionEnabled,
      reflectionMaxIter: agent.reflectionMaxIter,
      reflectionCriteria: agent.reflectionCriteria,
      teamId: agent.teamId,
      createdAt: agent.createdAt,
    });
  } catch (error) {
    console.error("Create agent error:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
