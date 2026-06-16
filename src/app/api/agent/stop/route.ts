import { stopRun } from "@/lib/agent/agent";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/agent/stop - Stop a running agent
export async function POST(req: NextRequest) {
  try {
    const { runId } = await req.json();

    if (!runId) {
      return NextResponse.json({ error: "runId is required" }, { status: 400 });
    }

    stopRun(runId);

    await db.agentRun.update({
      where: { id: runId },
      data: { status: "stopped" },
    }).catch(() => {});

    return NextResponse.json({ success: true, runId, status: "stopped" });
  } catch (error) {
    console.error("Stop agent error:", error);
    return NextResponse.json(
      { error: "Failed to stop agent" },
      { status: 500 }
    );
  }
}
