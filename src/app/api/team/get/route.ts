import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/team/get - Get a team by ID with all agents
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Team ID is required as query parameter" },
        { status: 400 }
      );
    }

    const team = await db.team.findUnique({
      where: { id },
      include: {
        agents: {
          select: {
            id: true,
            name: true,
            goal: true,
            role: true,
            orchestrationMode: true,
            model: true,
            tools: true,
            personality: true,
            maxSteps: true,
            reflectionEnabled: true,
            reflectionMaxIter: true,
            reflectionCriteria: true,
            maxConcurrency: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        mode: team.mode,
        maxConcurrency: team.maxConcurrency,
        terminationType: team.terminationType,
        terminationValue: team.terminationValue,
        sharedContext: team.sharedContext,
        agentCount: team.agents.length,
        agents: team.agents.map((a) => ({
          id: a.id,
          name: a.name,
          goal: a.goal,
          role: a.role,
          orchestrationMode: a.orchestrationMode,
          model: a.model,
          tools: a.tools,
          personality: a.personality,
          maxSteps: a.maxSteps,
          reflectionEnabled: a.reflectionEnabled,
          reflectionMaxIter: a.reflectionMaxIter,
          reflectionCriteria: a.reflectionCriteria,
          maxConcurrency: a.maxConcurrency,
        })),
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get team error:", error);
    return NextResponse.json(
      { error: "Failed to get team" },
      { status: 500 }
    );
  }
}
