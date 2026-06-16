import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { logger, logRequest } from "@/lib/logger";

import { ratelimit } from "@/lib/rate-limit";

// GET /api/agent/list - List all agents
export async function GET(req: NextRequest) {
  const start = Date.now();
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const limitResult = await ratelimit.api.limit(`list-${ip}`);
  if (!limitResult.success) {
    const res = NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
    logRequest(req, Date.now() - start, 429);
    return res;
  }

  try {
    const agents = await db.agent.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { runs: true } },
      },
    });

    const res = NextResponse.json(
      agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        goal: agent.goal,
        personality: agent.personality,
        tools: agent.tools.split(","),
        shortTermMemory: agent.shortTermMemory,
        longTermMemory: agent.longTermMemory,
        maxSteps: agent.maxSteps,
        autoRun: agent.autoRun,
        outputFormat: agent.outputFormat,
        graphData: agent.graphData ? JSON.parse(agent.graphData) : null,
        runCount: agent._count.runs,
        role: agent.role,
        model: agent.model,
        orchestrationMode: agent.orchestrationMode,
        maxConcurrency: agent.maxConcurrency,
        reflectionEnabled: agent.reflectionEnabled,
        reflectionMaxIter: agent.reflectionMaxIter,
        reflectionCriteria: agent.reflectionCriteria,
        teamId: agent.teamId,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      }))
    );
    logRequest(req, Date.now() - start, 200);
    return res;
  } catch (error) {
    logger.error({ error, url: req.url }, "List agents error");
    const res = NextResponse.json(
      { error: "Failed to list agents" },
      { status: 500 }
    );
    logRequest(req, Date.now() - start, 500);
    return res;
  }
}
