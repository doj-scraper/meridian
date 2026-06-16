import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/template/instantiate - Create an agent from a template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, name: overrideName, goal: overrideGoal } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    const template = await db.agentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const config = JSON.parse(template.config);

    // Apply overrides
    const agentName = overrideName || config.name || template.name;
    const agentGoal = overrideGoal || config.goal || "";

    if (!agentGoal) {
      return NextResponse.json(
        { error: "Goal is required (either in template config or as override)" },
        { status: 400 }
      );
    }

    // Create the agent from template config
    const agent = await db.agent.create({
      data: {
        name: agentName,
        goal: agentGoal,
        personality: config.personality || "helpful assistant",
        tools: Array.isArray(config.tools)
          ? config.tools.join(",")
          : config.tools || "search,write",
        shortTermMemory: config.memory?.shortTerm ?? true,
        longTermMemory: config.memory?.longTerm ?? false,
        maxSteps: config.loop?.maxSteps ?? 10,
        autoRun: config.loop?.autoRun ?? true,
        outputFormat: config.outputs?.format || "markdown",
        role: config.role || "general",
        model: config.model || "gemini-2.5-pro",
        orchestrationMode: config.orchestrationMode || "single",
        maxConcurrency: config.maxConcurrency ?? 3,
        reflectionEnabled: config.reflectionEnabled ?? false,
        reflectionMaxIter: config.reflectionMaxIter ?? 3,
        reflectionCriteria: config.reflectionCriteria || "APPROVED",
      },
    });

    // Increment template usage count
    await db.agentTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json({
      agent: {
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
        role: agent.role,
        model: agent.model,
        orchestrationMode: agent.orchestrationMode,
        maxConcurrency: agent.maxConcurrency,
        reflectionEnabled: agent.reflectionEnabled,
        reflectionMaxIter: agent.reflectionMaxIter,
        reflectionCriteria: agent.reflectionCriteria,
        templateId: template.id,
        templateName: template.name,
        createdAt: agent.createdAt,
      },
    });
  } catch (error) {
    console.error("Instantiate template error:", error);
    return NextResponse.json(
      { error: "Failed to instantiate template" },
      { status: 500 }
    );
  }
}
