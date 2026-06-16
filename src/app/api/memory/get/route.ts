import { NextRequest, NextResponse } from "next/server";
import { memoryManager } from "@/lib/agent/memory-v2";

/**
 * GET /api/memory/get?agentId=xxx&key=yyy&tier=session|persistent|artifact
 *
 * Retrieves a specific memory value.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const agentId = searchParams.get("agentId");
    const key = searchParams.get("key");
    const tier = searchParams.get("tier") as "session" | "persistent" | "artifact" | null;
    const runId = searchParams.get("runId") ?? undefined;

    if (!agentId || !key || !tier) {
      return NextResponse.json(
        { error: "agentId, key, and tier query parameters are required" },
        { status: 400 },
      );
    }

    if (!["session", "persistent", "artifact"].includes(tier)) {
      return NextResponse.json(
        { error: "tier must be one of: session, persistent, artifact" },
        { status: 400 },
      );
    }

    const value = await memoryManager.get(agentId, key, tier, runId);

    if (value === undefined) {
      return NextResponse.json(
        { error: `Key "${key}" not found in ${tier} tier` },
        { status: 404 },
      );
    }

    return NextResponse.json({ key, tier, value });
  } catch (error) {
    console.error("[/api/memory/get] Error:", error);
    return NextResponse.json(
      { error: "Failed to get memory entry" },
      { status: 500 },
    );
  }
}
