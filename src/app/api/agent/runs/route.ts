import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/agent/runs?agentId=xxx - Get runs for an agent
// GET /api/agent/runs?runId=xxx - Get a specific run with steps
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");
    const runId = searchParams.get("runId");

    if (runId) {
      // Get specific run with steps
      const run = await db.agentRun.findUnique({
        where: { id: runId },
        include: { steps: { orderBy: { stepNum: "asc" } } },
      });

      if (!run) {
        return NextResponse.json({ error: "Run not found" }, { status: 404 });
      }

      return NextResponse.json({
        id: run.id,
        agentId: run.agentId,
        status: run.status,
        result: run.result,
        steps: run.steps.map((step) => ({
          id: step.id,
          stepNum: step.stepNum,
          tool: step.tool,
          input: step.input,
          result: step.result,
          createdAt: step.createdAt,
        })),
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
      });
    }

    if (agentId) {
      // Get all runs for an agent
      const runs = await db.agentRun.findMany({
        where: { agentId },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { steps: true } } },
      });

      return NextResponse.json(
        runs.map((run) => ({
          id: run.id,
          agentId: run.agentId,
          status: run.status,
          result: run.result,
          stepCount: run._count.steps,
          createdAt: run.createdAt,
          updatedAt: run.updatedAt,
        }))
      );
    }

    // Get all recent runs
    const runs = await db.agentRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        agent: { select: { name: true, goal: true } },
        _count: { select: { steps: true } },
      },
    });

    return NextResponse.json(
      runs.map((run) => ({
        id: run.id,
        agentId: run.agentId,
        agentName: run.agent.name,
        status: run.status,
        result: run.result,
        stepCount: run._count.steps,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
      }))
    );
  } catch (error) {
    console.error("Get runs error:", error);
    return NextResponse.json(
      { error: "Failed to get runs" },
      { status: 500 }
    );
  }
}
