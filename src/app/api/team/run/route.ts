import { db } from "@/lib/db";
import { getOrchestrator, buildTeamConfig } from "@/lib/agent/orchestrator";
import { emitEvent } from "@/lib/agent/agent";
import { NextRequest, NextResponse } from "next/server";

// POST /api/team/run - Start a team orchestration run
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamId, goal } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    // Build TeamConfig from DB
    const teamConfig = await buildTeamConfig(teamId);
    if (!teamConfig) {
      return NextResponse.json(
        { error: "Team not found or has no agents" },
        { status: 404 }
      );
    }

    const runGoal = goal || `Orchestrate team: ${teamConfig.name}`;

    // Use the first agent in the team for the AgentRun record
    const firstAgent = teamConfig.agents[0];
    if (!firstAgent) {
      return NextResponse.json(
        { error: "Team has no agents" },
        { status: 400 }
      );
    }

    // Create an AgentRun record
    const run = await db.agentRun.create({
      data: {
        agentId: firstAgent.id,
        status: "running",
      },
    });

    // Emit orchestration start event
    emitEvent(run.id, {
      type: "orchestration_start",
      message: `Team "${teamConfig.name}" orchestration starting in ${teamConfig.mode} mode with ${teamConfig.agents.length} agents`,
      data: {
        teamId: teamConfig.id,
        teamName: teamConfig.name,
        mode: teamConfig.mode,
        agentCount: teamConfig.agents.length,
        agentNames: teamConfig.agents.map((a) => a.name),
        goal: runGoal,
      },
    });

    // Run orchestrator asynchronously
    getOrchestrator()
      .run(teamConfig, runGoal, run.id)
      .then(async (result) => {
        emitEvent(run.id, {
          type: "orchestration_complete",
          message: `Team "${teamConfig.name}" orchestration completed in ${result.mode} mode (${result.totalSteps} steps)`,
          data: {
            mode: result.mode,
            totalSteps: result.totalSteps,
            agentResults: result.agentResults,
          },
        });

        emitEvent(run.id, {
          type: "done",
          message: "Team orchestration completed",
          data: {
            output: result.output.substring(0, 500),
          },
        });

        // Update run status
        try {
          await db.agentRun.update({
            where: { id: run.id },
            data: {
              status: "completed",
              result: result.output.substring(0, 10000),
            },
          });
        } catch (dbError) {
          console.error("Failed to update completed run:", dbError);
        }
      })
      .catch(async (error) => {
        console.error("Team orchestration error:", error);

        emitEvent(run.id, {
          type: "error",
          message: `Team orchestration error: ${error instanceof Error ? error.message : String(error)}`,
        });

        emitEvent(run.id, {
          type: "done",
          message: "Team orchestration failed",
        });

        // Update run status to failed
        try {
          await db.agentRun.update({
            where: { id: run.id },
            data: {
              status: "failed",
              result: error instanceof Error ? error.message : "Unknown error",
            },
          });
        } catch (dbError) {
          console.error("Failed to update failed run:", dbError);
        }
      });

    return NextResponse.json({
      runId: run.id,
      teamId: teamConfig.id,
      teamName: teamConfig.name,
      mode: teamConfig.mode,
      agentCount: teamConfig.agents.length,
      agentNames: teamConfig.agents.map((a) => a.name),
      status: "running",
      goal: runGoal,
    });
  } catch (error) {
    console.error("Team run error:", error);
    return NextResponse.json(
      { error: "Failed to start team orchestration" },
      { status: 500 }
    );
  }
}
