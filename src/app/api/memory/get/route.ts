import { NextRequest, NextResponse } from "next/server";
import { memoryManager } from "@/lib/agent/memory-v2";
import { logger, logRequest } from "@/lib/logger";

/**
 * GET /api/memory/get?agentId=xxx&key=yyy&tier=session|persistent|artifact
 *
 * Retrieves a specific memory value.
 */
import { ratelimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const start = Date.now();
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const limitResult = await ratelimit.api.limit(`memory-get-${ip}`);
  if (!limitResult.success) {
    const res = NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
    logRequest(request, Date.now() - start, 429);
    return res;
  }

  try {
    const { searchParams } = request.nextUrl;
    const agentId = searchParams.get("agentId");
    const key = searchParams.get("key");
    const tier = searchParams.get("tier") as "session" | "persistent" | "artifact" | null;
    const runId = searchParams.get("runId") ?? undefined;

    if (!agentId || !key || !tier) {
      const res = NextResponse.json(
        { error: "agentId, key, and tier query parameters are required" },
        { status: 400 },
      );
      logRequest(request, Date.now() - start, 400);
      return res;
    }

    if (!["session", "persistent", "artifact"].includes(tier)) {
      const res = NextResponse.json(
        { error: "tier must be one of: session, persistent, artifact" },
        { status: 400 },
      );
      logRequest(request, Date.now() - start, 400);
      return res;
    }

    const value = await memoryManager.get(agentId, key, tier, runId);

    if (value === undefined) {
      const res = NextResponse.json(
        { error: `Key "${key}" not found in ${tier} tier` },
        { status: 404 },
      );
      logRequest(request, Date.now() - start, 404);
      return res;
    }

    const res = NextResponse.json({ key, tier, value });
    logRequest(request, Date.now() - start, 200);
    return res;
  } catch (error) {
    logger.error({ error, url: request.url }, "Get memory error");
    const res = NextResponse.json(
      { error: "Failed to get memory entry" },
      { status: 500 },
    );
    logRequest(request, Date.now() - start, 500);
    return res;
  }
}
