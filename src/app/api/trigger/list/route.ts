import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/trigger/list - List triggers with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (agentId) {
      where.agentId = agentId;
    }
    if (type) {
      where.type = type;
    }

    const triggers = await db.agentTrigger.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const result = triggers.map((t) => ({
      id: t.id,
      agentId: t.agentId,
      type: t.type,
      config: JSON.parse(t.config),
      enabled: t.enabled,
      lastRunAt: t.lastRunAt,
      nextRunAt: t.nextRunAt,
      runCount: t.runCount,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json({ triggers: result });
  } catch (error) {
    console.error("List triggers error:", error);
    return NextResponse.json(
      { error: "Failed to list triggers" },
      { status: 500 }
    );
  }
}
