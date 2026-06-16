import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/template/create - Create a new agent template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, category = "general", config, isPublic = true } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    if (!config || typeof config !== "object") {
      return NextResponse.json(
        { error: "Config (AgentConfig object) is required" },
        { status: 400 }
      );
    }

    const validCategories = [
      "general",
      "research",
      "coding",
      "writing",
      "business",
      "multi-agent",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const template = await db.agentTemplate.create({
      data: {
        name: name.trim(),
        description: description || null,
        category,
        config: JSON.stringify(config),
        isPublic,
      },
    });

    return NextResponse.json(
      {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          config: JSON.parse(template.config),
          isPublic: template.isPublic,
          usageCount: template.usageCount,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
