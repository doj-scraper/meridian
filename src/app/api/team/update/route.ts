import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/team/update - Update team configuration
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      mode,
      maxConcurrency,
      terminationType,
      terminationValue,
      sharedContext,
      agentIds,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Verify team exists
    const existingTeam = await db.team.findUnique({
      where: { id },
      include: { agents: true },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Validate mode if provided
    if (mode) {
      const validModes = ["sequential", "group", "hierarchical", "parallel"];
      if (!validModes.includes(mode)) {
        return NextResponse.json(
          { error: `Invalid mode. Must be one of: ${validModes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (mode !== undefined) updateData.mode = mode;
    if (maxConcurrency !== undefined) updateData.maxConcurrency = maxConcurrency;
    if (terminationType !== undefined) updateData.terminationType = terminationType;
    if (terminationValue !== undefined) updateData.terminationValue = terminationValue;
    if (sharedContext !== undefined) updateData.sharedContext = sharedContext;

    // Update team fields
    if (Object.keys(updateData).length > 0) {
      await db.team.update({
        where: { id },
        data: updateData,
      });
    }

    // Re-link agents if agentIds provided
    if (agentIds !== undefined) {
      if (!Array.isArray(agentIds)) {
        return NextResponse.json(
          { error: "agentIds must be an array of strings" },
          { status: 400 }
        );
      }

      // Verify all agents exist
      if (agentIds.length > 0) {
        const agents = await db.agent.findMany({
          where: { id: { in: agentIds } },
        });
        if (agents.length !== agentIds.length) {
          const foundIds = agents.map((a) => a.id);
          const missingIds = agentIds.filter(
            (aid: string) => !foundIds.includes(aid)
          );
          return NextResponse.json(
            { error: `Agents not found: ${missingIds.join(", ")}` },
            { status: 404 }
          );
        }
      }

      // Unlink all current agents from this team
      await db.agent.updateMany({
        where: { teamId: id },
        data: { teamId: null },
      });

      // Link the new set of agents
      if (agentIds.length > 0) {
        await db.agent.updateMany({
          where: { id: { in: agentIds } },
          data: { teamId: id },
        });
      }
    }

    // Return the updated team with agents
    const updatedTeam = await db.team.findUnique({
      where: { id },
      include: { agents: true },
    });

    return NextResponse.json({
      team: {
        id: updatedTeam!.id,
        name: updatedTeam!.name,
        mode: updatedTeam!.mode,
        maxConcurrency: updatedTeam!.maxConcurrency,
        terminationType: updatedTeam!.terminationType,
        terminationValue: updatedTeam!.terminationValue,
        sharedContext: updatedTeam!.sharedContext,
        agentCount: updatedTeam!.agents.length,
        agents: updatedTeam!.agents.map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          orchestrationMode: a.orchestrationMode,
        })),
        createdAt: updatedTeam!.createdAt,
        updatedAt: updatedTeam!.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update team error:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}
