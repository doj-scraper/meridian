import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/task-graph/create - Create a new task graph
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, nodes = [], edges = [] } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Task graph name is required" },
        { status: 400 }
      );
    }

    // Validate nodes structure
    if (!Array.isArray(nodes)) {
      return NextResponse.json(
        { error: "nodes must be an array" },
        { status: 400 }
      );
    }

    // Validate edges structure
    if (!Array.isArray(edges)) {
      return NextResponse.json(
        { error: "edges must be an array" },
        { status: 400 }
      );
    }

    const graph = await db.taskGraph.create({
      data: {
        name: name.trim(),
        description: description || null,
        nodes: {
          create: nodes.map((node: Record<string, unknown>) => ({
            agentId: (node.agentId as string) || null,
            label: (node.label as string) || "Untitled",
            type: (node.type as string) || "agent",
            config: JSON.stringify(node.config || {}),
            positionX: (node.positionX as number) || 0,
            positionY: (node.positionY as number) || 0,
          })),
        },
        edges: {
          create: edges.map((edge: Record<string, unknown>) => ({
            sourceId: edge.sourceId as string,
            targetId: edge.targetId as string,
            condition: edge.condition ? JSON.stringify(edge.condition) : null,
            label: (edge.label as string) || null,
          })),
        },
      },
      include: { nodes: true, edges: true },
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create task graph error:", error);
    return NextResponse.json(
      { error: "Failed to create task graph" },
      { status: 500 }
    );
  }
}
