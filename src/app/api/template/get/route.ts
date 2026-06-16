import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/template/get - Get a template by ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    const template = await db.agentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Get template error:", error);
    return NextResponse.json(
      { error: "Failed to get template" },
      { status: 500 }
    );
  }
}
