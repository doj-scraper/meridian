import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 });
    }

    // Check agent exists
    const agent = await db.agent.findUnique({ where: { id } });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Delete agent (cascade deletes runs and steps)
    await db.agent.delete({ where: { id } });

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error("Delete agent error:", error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
