import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/template/list - List templates with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isPublic = searchParams.get("isPublic");

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category;
    }
    if (isPublic !== null) {
      where.isPublic = isPublic === "true";
    }

    const templates = await db.agentTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const result = templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      config: JSON.parse(t.config),
      isPublic: t.isPublic,
      usageCount: t.usageCount,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json({ templates: result });
  } catch (error) {
    console.error("List templates error:", error);
    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 }
    );
  }
}
