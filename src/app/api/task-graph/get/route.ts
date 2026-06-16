import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/task-graph/get - Get a task graph with nodes and edges
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

    const graph = await db.taskGraph.findUnique({
      where: { id },
      include: { nodes: true, edges: true },
    });

    if (!graph) {
      return NextResponse.json(
        { error: "Task graph not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      graph: {
        id: graph.id,
        name: graph.name,
        description: graph.description,
        nodes: graph.nodes.map((n) => ({
          id: n.id,
          graphId: n.graphId,
          agentId: n.agentId,
          label: n.label,
          type: n.type,
          config: JSON.parse(n.config),
          positionX: n.positionX,
          positionY: n.positionY,
          createdAt: n.createdAt,
        })),
        edges: graph.edges.map((e) => ({
          id: e.id,
          graphId: e.graphId,
          sourceId: e.sourceId,
          targetId: e.targetId,
          condition: e.condition ? JSON.parse(e.condition) : null,
          label: e.label,
          createdAt: e.createdAt,
        })),
        createdAt: graph.createdAt,
        updatedAt: graph.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get task graph error:", error);
    return NextResponse.json(
      { error: "Failed to get task graph" },
      { status: 500 }
    );
  }
}
