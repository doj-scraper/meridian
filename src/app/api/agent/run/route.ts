import { db } from "@/lib/db";
import { runAgent, emitEvent, isRunActive } from "@/lib/agent/agent";
import { getOrchestrator, buildTeamFromAgent } from "@/lib/agent/orchestrator";
import { AgentConfig, AgentTool } from "@/lib/agent/types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateBody } from "@/lib/validation";
import { logger, logRequest } from "@/lib/logger";

import { ratelimit } from "@/lib/rate-limit";

const runAgentSchema = z.object({
  agentId: z.string().optional(),
  goal: z.string().optional(),
}).refine((data) => data.agentId || data.goal, {
  message: "Either agentId or goal is required",
});

// POST /api/agent/run - Start an agent run (supports single-agent and orchestrated modes)
export async function POST(req: NextRequest) {
  const start = Date.now();
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const limitResult = await ratelimit.agent.limit(`run-${ip}`);
  if (!limitResult.success) {
    const res = NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
    logRequest(req, Date.now() - start, 429);
    return res;
  }

  const validatedBody = await validateBody(runAgentSchema)(req);
  if (validatedBody instanceof Response) {
    logRequest(req, Date.now() - start, validatedBody.status);
    return validatedBody;
  }

  try {
    const { agentId, goal } = validatedBody;

    // Get the agent config
    let agent;
    let runGoal = goal;

    if (agentId) {
      agent = await db.agent.findUnique({ where: { id: agentId } });
      if (!agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }
      runGoal = runGoal || agent.goal;
    }

    // Create a run record
    const run = await db.agentRun.create({
      data: {
        agentId: agent?.id || (await db.agent.create({
          data: {
            name: "Quick Run",
            goal: runGoal,
            tools: "search,write,code",
            maxSteps: 10,
            autoRun: true,
            outputFormat: "markdown",
          },
        })).id,
        status: "running",
      },
    });

    // Build the agent config
    const agentData = agent || await db.agent.findUnique({ where: { id: run.agentId } });
    const config: AgentConfig = {
      id: agentData!.id,
      name: agentData!.name,
      goal: runGoal,
      personality: agentData!.personality || "helpful assistant",
      tools: agentData!.tools.split(",") as AgentTool[],
      memory: {
        shortTerm: agentData!.shortTermMemory,
        longTerm: agentData!.longTermMemory,
      },
      loop: {
        maxSteps: agentData!.maxSteps,
        autoRun: agentData!.autoRun,
      },
      outputs: {
        format: (agentData!.outputFormat as "text" | "json" | "markdown") || "markdown",
      },
      // V2 fields
      role: (agentData!.role as AgentConfig["role"]) || "general",
      model: agentData!.model || "gemini-2.5-pro",
      orchestrationMode: (agentData!.orchestrationMode as AgentConfig["orchestrationMode"]) || "single",
      reflectionEnabled: agentData!.reflectionEnabled || false,
      reflectionMaxIter: agentData!.reflectionMaxIter || 3,
      reflectionCriteria: agentData!.reflectionCriteria || "APPROVED",
      maxConcurrency: agentData!.maxConcurrency || 3,
    };

    // Determine orchestration mode and run accordingly
    const orchestrationMode = config.orchestrationMode || "single";

    if (orchestrationMode === "single") {
      // Original single-agent run path
      runAgent(run.id, config).catch(async (error) => {
        console.error("Agent run error:", error);
        emitEvent(run.id, { type: "error", message: `Agent error: ${error.message}` });
        emitEvent(run.id, { type: "done", message: "Run failed" });
        await db.agentRun.update({
          where: { id: run.id },
          data: { status: "failed" },
        }).catch(() => {});
      });
    } else {
      // Orchestration mode: use the orchestrator
      const teamConfig = buildTeamFromAgent(config);

      emitEvent(run.id, {
        type: "orchestration_start",
        message: `Agent "${config.name}" starting in ${orchestrationMode} orchestration mode`,
        data: {
          agentId: config.id,
          agentName: config.name,
          mode: orchestrationMode,
        },
      });

      getOrchestrator()
        .run(teamConfig, runGoal, run.id)
        .then(async (result) => {
          emitEvent(run.id, {
            type: "orchestration_complete",
            message: `Orchestration completed in ${result.mode} mode (${result.totalSteps} steps)`,
            data: {
              mode: result.mode,
              totalSteps: result.totalSteps,
              agentResults: result.agentResults,
            },
          });

          emitEvent(run.id, {
            type: "done",
            message: "Orchestrated run completed",
            data: { output: result.output.substring(0, 500) },
          });

          try {
            await db.agentRun.update({
              where: { id: run.id },
              data: {
                status: "completed",
                result: result.output.substring(0, 10000),
              },
            });
          } catch (dbError) {
            console.error("Failed to update completed orchestrated run:", dbError);
          }
        })
        .catch(async (error) => {
          console.error("Orchestrated run error:", error);

          emitEvent(run.id, {
            type: "error",
            message: `Orchestration error: ${error instanceof Error ? error.message : String(error)}`,
          });

          emitEvent(run.id, { type: "done", message: "Orchestrated run failed" });

          try {
            await db.agentRun.update({
              where: { id: run.id },
              data: {
                status: "failed",
                result: error instanceof Error ? error.message : "Unknown orchestration error",
              },
            });
          } catch (dbError) {
            console.error("Failed to update failed orchestrated run:", dbError);
          }
        });
    }

    const res = NextResponse.json({
      runId: run.id,
      agentId: run.agentId,
      status: "running",
      orchestrationMode,
      config: {
        name: config.name,
        goal: config.goal,
        tools: config.tools,
        maxSteps: config.loop.maxSteps,
      },
    });
    logRequest(req, Date.now() - start, 200);
    return res;
  } catch (error) {
    logger.error({ error, url: req.url }, "Run agent error");
    const res = NextResponse.json(
      { error: "Failed to start agent run" },
      { status: 500 }
    );
    logRequest(req, Date.now() - start, 500);
    return res;
  }
}
