import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/artifacts/list?agentId=xxx
 *
 * Lists all artifacts for an agent.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId query parameter is required" },
        { status: 400 },
      );
    }

    const artifacts = await db.artifact.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    });

    const formatted = artifacts.map((a) => ({
      id: a.id,
      agentId: a.agentId,
      runId: a.runId,
      name: a.name,
      type: a.type,
      content: a.content,
      metadata: a.metadata ? safeJsonParse(a.metadata) : null,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ artifacts: formatted });
  } catch (error) {
    console.error("[/api/artifacts/list] Error:", error);
    return NextResponse.json(
      { error: "Failed to list artifacts" },
      { status: 500 },
    );
  }
}

function safeJsonParse(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
