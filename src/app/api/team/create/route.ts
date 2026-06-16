import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/team/create - Create a new team
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      mode,
      maxConcurrency,
      terminationType,
      terminationValue,
      sharedContext,
      agentIds,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Validate mode if provided
    const validModes = ["sequential", "group", "hierarchical", "parallel"];
    const teamMode = mode || "sequential";
    if (!validModes.includes(teamMode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${validModes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate agentIds if provided
    if (agentIds && !Array.isArray(agentIds)) {
      return NextResponse.json(
        { error: "agentIds must be an array of strings" },
        { status: 400 }
      );
    }

    // Verify all agents exist if agentIds provided
    if (agentIds && agentIds.length > 0) {
      const agents = await db.agent.findMany({
        where: { id: { in: agentIds } },
      });
      if (agents.length !== agentIds.length) {
        const foundIds = agents.map((a) => a.id);
        const missingIds = agentIds.filter(
          (id: string) => !foundIds.includes(id)
        );
        return NextResponse.json(
          { error: `Agents not found: ${missingIds.join(", ")}` },
          { status: 404 }
        );
      }
    }

    // Create the team
    const team = await db.team.create({
      data: {
        name: name.trim(),
        mode: teamMode,
        maxConcurrency: maxConcurrency ?? 3,
        terminationType: terminationType ?? "max_steps",
        terminationValue: terminationValue ?? 20,
        sharedContext: sharedContext ?? false,
      },
    });

    // Link agents to the team if provided
    if (agentIds && agentIds.length > 0) {
      await db.agent.updateMany({
        where: { id: { in: agentIds } },
        data: { teamId: team.id },
      });
    }

    // Return the team with its agents
    const teamWithAgents = await db.team.findUnique({
      where: { id: team.id },
      include: { agents: true },
    });

    return NextResponse.json(
      {
        team: {
          id: teamWithAgents!.id,
          name: teamWithAgents!.name,
          mode: teamWithAgents!.mode,
          maxConcurrency: teamWithAgents!.maxConcurrency,
          terminationType: teamWithAgents!.terminationType,
          terminationValue: teamWithAgents!.terminationValue,
          sharedContext: teamWithAgents!.sharedContext,
          agentCount: teamWithAgents!.agents.length,
          agents: teamWithAgents!.agents.map((a) => ({
            id: a.id,
            name: a.name,
            role: a.role,
            orchestrationMode: a.orchestrationMode,
          })),
          createdAt: teamWithAgents!.createdAt,
          updatedAt: teamWithAgents!.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
