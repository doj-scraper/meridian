import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/agent/update - Update an agent's config or graph data
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Agent id is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};

    // V1 fields
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.goal !== undefined) data.goal = updates.goal;
    if (updates.personality !== undefined) data.personality = updates.personality;
    if (updates.tools !== undefined) data.tools = Array.isArray(updates.tools) ? updates.tools.join(",") : updates.tools;
    if (updates.shortTermMemory !== undefined) data.shortTermMemory = updates.shortTermMemory;
    if (updates.longTermMemory !== undefined) data.longTermMemory = updates.longTermMemory;
    if (updates.maxSteps !== undefined) data.maxSteps = updates.maxSteps;
    if (updates.autoRun !== undefined) data.autoRun = updates.autoRun;
    if (updates.outputFormat !== undefined) data.outputFormat = updates.outputFormat;
    if (updates.graphData !== undefined) data.graphData = JSON.stringify(updates.graphData);

    // V2 fields
    if (updates.role !== undefined) data.role = updates.role;
    if (updates.model !== undefined) data.model = updates.model;
    if (updates.orchestrationMode !== undefined) data.orchestrationMode = updates.orchestrationMode;
    if (updates.maxConcurrency !== undefined) data.maxConcurrency = updates.maxConcurrency;
    if (updates.reflectionEnabled !== undefined) data.reflectionEnabled = updates.reflectionEnabled;
    if (updates.reflectionMaxIter !== undefined) data.reflectionMaxIter = updates.reflectionMaxIter;
    if (updates.reflectionCriteria !== undefined) data.reflectionCriteria = updates.reflectionCriteria;
    if (updates.teamId !== undefined) data.teamId = updates.teamId;

    const agent = await db.agent.update({
      where: { id },
      data,
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
      updatedAt: agent.updatedAt,
    });
  } catch (error) {
    console.error("Update agent error:", error);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}
