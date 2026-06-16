import { buildAgent } from "@/lib/agent/planner";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/agent/build - Build an agent from natural language
export async function POST(req: NextRequest) {
  try {
    const { userInput, save = true } = await req.json();

    if (!userInput) {
      return NextResponse.json(
        { error: "userInput is required" },
        { status: 400 }
      );
    }

    // Use the builder agent to create a config
    const config = await buildAgent(userInput);

    // Optionally save the agent
    let agent: { id: string; name: string; createdAt: Date } | null = null;
    if (save && config) {
      const created = await db.agent.create({
        data: {
          name: config.name,
          goal: config.goal,
          personality: config.personality,
          tools: config.tools.join(","),
          shortTermMemory: config.memory.shortTerm,
          longTermMemory: config.memory.longTerm,
          maxSteps: config.loop.maxSteps,
          autoRun: config.loop.autoRun,
          outputFormat: config.outputs.format,
        },
      });
      agent = { id: created.id, name: created.name, createdAt: created.createdAt };
    }

    return NextResponse.json({
      config,
      agent: agent
        ? {
            id: agent.id,
            name: agent.name,
            createdAt: agent.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Build agent error:", error);
    return NextResponse.json(
      { error: "Failed to build agent" },
      { status: 500 }
    );
  }
}
