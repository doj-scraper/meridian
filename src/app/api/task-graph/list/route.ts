import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/task-graph/list - List all task graphs
export async function GET() {
  try {
    const graphs = await db.taskGraph.findMany({
      include: {
        nodes: true,
        edges: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const result = graphs.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      nodeCount: g.nodes.length,
      edgeCount: g.edges.length,
      nodes: g.nodes.map((n) => ({
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
      edges: g.edges.map((e) => ({
        id: e.id,
        graphId: e.graphId,
        sourceId: e.sourceId,
        targetId: e.targetId,
        condition: e.condition ? JSON.parse(e.condition) : null,
        label: e.label,
        createdAt: e.createdAt,
      })),
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));

    return NextResponse.json({ graphs: result });
  } catch (error) {
    console.error("List task graphs error:", error);
    return NextResponse.json(
      { error: "Failed to list task graphs" },
      { status: 500 }
    );
  }
}
