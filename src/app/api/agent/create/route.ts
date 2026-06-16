import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

import { ratelimit } from "@/lib/rate-limit";

import { z } from "zod";
import { validateBody } from "@/lib/validation";
import { logger, logRequest } from "@/lib/logger";

const createAgentSchema = z.object({
  name: z.string("Name and goal are required").min(1, "Name and goal are required").max(100),
  goal: z.string("Name and goal are required").min(1, "Name and goal are required").max(1000),
  personality: z.string().optional().default("helpful assistant"),
  tools: z.preprocess(
    (val) => {
      if (typeof val === 'string') return val.split(',').map(s => s.trim());
      return val;
    },
    z.array(z.enum(['search', 'write', 'code', 'browser', 'finish']))
  ).optional().default(["search", "write"]),
  shortTermMemory: z.boolean().optional().default(true),
  longTermMemory: z.boolean().optional().default(false),
  maxSteps: z.number().int().optional().default(10),
  autoRun: z.boolean().optional().default(true),
  outputFormat: z.enum(["text", "json", "markdown"]).optional().default("markdown"),
  graphData: z.any().optional().nullable().default(null),
  role: z.enum(["general", "planner", "researcher", "executor", "critic", "reviewer"]).optional().default("general"),
  model: z.string().optional().default("gemini-2.5-pro"),
  orchestrationMode: z.enum(["single", "sequential", "group", "hierarchical", "parallel"]).optional().default("single"),
  maxConcurrency: z.number().int().optional().default(3),
  reflectionEnabled: z.boolean().optional().default(false),
  reflectionMaxIter: z.number().int().optional().default(3),
  reflectionCriteria: z.string().optional().default("APPROVED"),
  teamId: z.string().optional().nullable().default(null),
});

// POST /api/agent/create - Create a new agent
export async function POST(req: NextRequest) {
  const start = Date.now();
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const limitResult = await ratelimit.api.limit(`create-${ip}`);
  if (!limitResult.success) {
    const res = NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
    logRequest(req, Date.now() - start, 429);
    return res;
  }

  const validatedBody = await validateBody(createAgentSchema)(req);
  if (validatedBody instanceof Response) {
    logRequest(req, Date.now() - start, validatedBody.status);
    return validatedBody;
  }

  try {
    const {
      name,
      goal,
      personality,
      tools,
      shortTermMemory,
      longTermMemory,
      maxSteps,
      autoRun,
      outputFormat,
      graphData,
      role,
      model,
      orchestrationMode,
      maxConcurrency,
      reflectionEnabled,
      reflectionMaxIter,
      reflectionCriteria,
      teamId,
    } = validatedBody;

    const agent = await db.agent.create({
      data: {
        name,
        goal,
        personality,
        tools: Array.isArray(tools) ? tools.join(",") : tools,
        shortTermMemory,
        longTermMemory,
        maxSteps,
        autoRun,
        outputFormat,
        graphData: graphData ? JSON.stringify(graphData) : null,
        role,
        model,
        orchestrationMode,
        maxConcurrency,
        reflectionEnabled,
        reflectionMaxIter,
        reflectionCriteria,
        teamId,
      },
    });

    const res = NextResponse.json({
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
      role: agent.role,
      model: agent.model,
      orchestrationMode: agent.orchestrationMode,
      maxConcurrency: agent.maxConcurrency,
      reflectionEnabled: agent.reflectionEnabled,
      reflectionMaxIter: agent.reflectionMaxIter,
      reflectionCriteria: agent.reflectionCriteria,
      teamId: agent.teamId,
      createdAt: agent.createdAt,
    });
    logRequest(req, Date.now() - start, 200);
    return res;
  } catch (error) {
    logger.error({ error, url: req.url }, "Create agent error");
    const res = NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
    logRequest(req, Date.now() - start, 500);
    return res;
  }
}
