import { NextRequest, NextResponse } from "next/server";
import { memoryManager } from "@/lib/agent/memory-v2";

/**
 * POST /api/memory/set
 *
 * Body: { agentId, key, value, tier, runId? }
 *
 * Sets a memory value in the specified tier.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, key, value, tier, runId } = body as {
      agentId?: string;
      key?: string;
      value?: unknown;
      tier?: string;
      runId?: string;
    };

    if (!agentId || !key || !tier) {
      return NextResponse.json(
        { error: "agentId, key, and tier are required" },
        { status: 400 },
      );
    }

    if (!["session", "persistent", "artifact"].includes(tier)) {
      return NextResponse.json(
        { error: "tier must be one of: session, persistent, artifact" },
        { status: 400 },
      );
    }

    await memoryManager.set(
      agentId,
      key,
      value,
      tier as "session" | "persistent" | "artifact",
      runId,
    );

    return NextResponse.json({ success: true, key, tier });
  } catch (error) {
    console.error("[/api/memory/set] Error:", error);
    return NextResponse.json(
      { error: "Failed to set memory entry" },
      { status: 500 },
    );
  }
}
