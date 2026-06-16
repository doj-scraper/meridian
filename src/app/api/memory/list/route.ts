import { NextRequest, NextResponse } from "next/server";
import { memoryManager } from "@/lib/agent/memory-v2";

/**
 * GET /api/memory/list?agentId=xxx&tier=session|persistent|artifact
 *
 * Lists all memory entries for an agent in a given tier.
 * If tier is "artifact", returns artifacts instead.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const agentId = searchParams.get("agentId");
    const tier = searchParams.get("tier") as "session" | "persistent" | "artifact" | null;

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId query parameter is required" },
        { status: 400 },
      );
    }

    if (tier === "artifact") {
      const artifacts = await memoryManager.listArtifacts(agentId);
      return NextResponse.json({ tier: "artifact", entries: artifacts });
    }

    const effectiveTier = tier || "persistent";
    if (!["session", "persistent", "artifact"].includes(effectiveTier)) {
      return NextResponse.json(
        { error: "tier must be one of: session, persistent, artifact" },
        { status: 400 },
      );
    }

    const entries = await memoryManager.list(agentId, effectiveTier);
    return NextResponse.json({ tier: effectiveTier, entries });
  } catch (error) {
    console.error("[/api/memory/list] Error:", error);
    return NextResponse.json(
      { error: "Failed to list memory entries" },
      { status: 500 },
    );
  }
}
