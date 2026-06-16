import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/team/list - List all teams with their agents
export async function GET(_req: NextRequest) {
  try {
    const teams = await db.team.findMany({
      include: {
        agents: {
          select: {
            id: true,
            name: true,
            role: true,
            orchestrationMode: true,
            model: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = teams.map((team) => ({
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
        role: a.role,
        orchestrationMode: a.orchestrationMode,
        model: a.model,
      })),
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    }));

    return NextResponse.json({ teams: result });
  } catch (error) {
    console.error("List teams error:", error);
    return NextResponse.json(
      { error: "Failed to list teams" },
      { status: 500 }
    );
  }
}
