import { NextRequest, NextResponse } from "next/server";
import { memoryManager } from "@/lib/agent/memory-v2";

/**
 * GET /api/artifacts/get?agentId=xxx&name=yyy
 *
 * Gets a specific artifact by agentId and name.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const agentId = searchParams.get("agentId");
    const name = searchParams.get("name");

    if (!agentId || !name) {
      return NextResponse.json(
        { error: "agentId and name query parameters are required" },
        { status: 400 },
      );
    }

    const artifact = await memoryManager.getArtifact(agentId, name);

    if (!artifact) {
      return NextResponse.json(
        { error: `Artifact "${name}" not found for agent "${agentId}"` },
        { status: 404 },
      );
    }

    return NextResponse.json({ artifact });
  } catch (error) {
    console.error("[/api/artifacts/get] Error:", error);
    return NextResponse.json(
      { error: "Failed to get artifact" },
      { status: 500 },
    );
  }
}
