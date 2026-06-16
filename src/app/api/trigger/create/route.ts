import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/trigger/create - Create a new agent trigger
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, type, config, enabled = true } = body;

    if (!agentId || typeof agentId !== "string") {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 }
      );
    }

    const validTypes = ["cron", "webhook", "event"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type is required and must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (!config || typeof config !== "object") {
      return NextResponse.json(
        { error: "config object is required" },
        { status: 400 }
      );
    }

    // Verify agent exists
    const agent = await db.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    const trigger = await db.agentTrigger.create({
      data: {
        agentId,
        type,
        config: JSON.stringify(config),
        enabled,
      },
    });

    return NextResponse.json(
      {
        trigger: {
          id: trigger.id,
          agentId: trigger.agentId,
          type: trigger.type,
          config: JSON.parse(trigger.config),
          enabled: trigger.enabled,
          lastRunAt: trigger.lastRunAt,
          nextRunAt: trigger.nextRunAt,
          runCount: trigger.runCount,
          createdAt: trigger.createdAt,
          updatedAt: trigger.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create trigger error:", error);
    return NextResponse.json(
      { error: "Failed to create trigger" },
      { status: 500 }
    );
  }
}
