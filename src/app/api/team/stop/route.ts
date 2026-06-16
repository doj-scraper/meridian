import { getOrchestrator } from "@/lib/agent/orchestrator";
import { NextRequest, NextResponse } from "next/server";

// POST /api/team/stop - Stop a team orchestration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    const orchestrator = getOrchestrator();
    orchestrator.stop(teamId);

    return NextResponse.json({
      success: true,
      message: `Team orchestration stopped for team ${teamId}`,
      teamId,
    });
  } catch (error) {
    console.error("Team stop error:", error);
    return NextResponse.json(
      { error: "Failed to stop team orchestration" },
      { status: 500 }
    );
  }
}
