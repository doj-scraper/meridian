import { NextRequest, NextResponse } from "next/server";
import { toolRegistry } from "@/lib/agent/tool-registry";

/**
 * GET /api/tools/list?category=search|write|code|browser|memory|api|custom
 *
 * Lists all registered tools, optionally filtered by category.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category") as
      | "search"
      | "write"
      | "code"
      | "browser"
      | "memory"
      | "api"
      | "custom"
      | null;

    const tools = toolRegistry.list(category ?? undefined);

    // Serialize tool definitions for the API response
    const serialized = tools.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      riskLevel: t.riskLevel,
      validator: t.validator
        ? { type: t.validator.type, config: t.validator.config }
        : null,
    }));

    return NextResponse.json({ tools: serialized, count: serialized.length });
  } catch (error) {
    console.error("[/api/tools/list] Error:", error);
    return NextResponse.json(
      { error: "Failed to list tools" },
      { status: 500 },
    );
  }
}
