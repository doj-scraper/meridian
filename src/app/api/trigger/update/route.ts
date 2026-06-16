import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/trigger/update - Update a trigger
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, type, config, enabled, agentId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const existing = await db.agentTrigger.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Trigger not found" },
        { status: 404 }
      );
    }

    // Validate type if provided
    if (type) {
      const validTypes = ["cron", "webhook", "event"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `type must be one of: ${validTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Validate agentId if provided
    if (agentId) {
      const agent = await db.agent.findUnique({ where: { id: agentId } });
      if (!agent) {
        return NextResponse.json(
          { error: "Agent not found" },
          { status: 404 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (type !== undefined) data.type = type;
    if (config !== undefined) data.config = JSON.stringify(config);
    if (enabled !== undefined) data.enabled = enabled;
    if (agentId !== undefined) data.agentId = agentId;

    const trigger = await db.agentTrigger.update({
      where: { id },
      data,
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Update trigger error:", error);
    return NextResponse.json(
      { error: "Failed to update trigger" },
      { status: 500 }
    );
  }
}
