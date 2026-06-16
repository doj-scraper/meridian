import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/task-graph/delete - Delete a task graph by ID
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    const graph = await db.taskGraph.findUnique({ where: { id } });
    if (!graph) {
      return NextResponse.json(
        { error: "Task graph not found" },
        { status: 404 }
      );
    }

    // Cascade deletes will handle nodes and edges
    await db.taskGraph.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete task graph error:", error);
    return NextResponse.json(
      { error: "Failed to delete task graph" },
      { status: 500 }
    );
  }
}
