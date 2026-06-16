import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/task-graph/update - Update a task graph (name, description, nodes, edges)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, nodes, edges } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const existing = await db.taskGraph.findUnique({
      where: { id },
      include: { nodes: true, edges: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Task graph not found" },
        { status: 404 }
      );
    }

    // Update basic graph fields
    const graphData: Record<string, unknown> = {};
    if (name !== undefined) graphData.name = name.trim();
    if (description !== undefined) graphData.description = description;

    await db.taskGraph.update({
      where: { id },
      data: graphData,
    });

    // If nodes are provided, replace all nodes
    if (nodes !== undefined && Array.isArray(nodes)) {
      // Delete existing nodes (cascades to edges referencing them is not a concern
      // since edges are also replaced below, but we delete edges first to be safe)
      await db.taskEdge.deleteMany({ where: { graphId: id } });
      await db.taskNode.deleteMany({ where: { graphId: id } });

      // Create new nodes
      for (const node of nodes) {
        await db.taskNode.create({
          data: {
            id: node.id, // Preserve client IDs if provided
            graphId: id,
            agentId: node.agentId || null,
            label: node.label || "Untitled",
            type: node.type || "agent",
            config: JSON.stringify(node.config || {}),
            positionX: node.positionX || 0,
            positionY: node.positionY || 0,
          },
        });
      }

      // Create new edges if provided
      if (edges !== undefined && Array.isArray(edges)) {
        for (const edge of edges) {
          await db.taskEdge.create({
            data: {
              id: edge.id, // Preserve client IDs if provided
              graphId: id,
              sourceId: edge.sourceId,
              targetId: edge.targetId,
              condition: edge.condition ? JSON.stringify(edge.condition) : null,
              label: edge.label || null,
            },
          });
        }
      }
    } else if (edges !== undefined && Array.isArray(edges)) {
      // Only edges are being updated (nodes not provided)
      await db.taskEdge.deleteMany({ where: { graphId: id } });

      for (const edge of edges) {
        await db.taskEdge.create({
          data: {
            id: edge.id,
            graphId: id,
            sourceId: edge.sourceId,
            targetId: edge.targetId,
            condition: edge.condition ? JSON.stringify(edge.condition) : null,
            label: edge.label || null,
          },
        });
      }
    }

    // Fetch updated graph
    const updated = await db.taskGraph.findUnique({
      where: { id },
      include: { nodes: true, edges: true },
    });

    return NextResponse.json({
      graph: {
        id: updated!.id,
        name: updated!.name,
        description: updated!.description,
        nodes: updated!.nodes.map((n) => ({
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
        edges: updated!.edges.map((e) => ({
          id: e.id,
          graphId: e.graphId,
          sourceId: e.sourceId,
          targetId: e.targetId,
          condition: e.condition ? JSON.parse(e.condition) : null,
          label: e.label,
          createdAt: e.createdAt,
        })),
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update task graph error:", error);
    return NextResponse.json(
      { error: "Failed to update task graph" },
      { status: 500 }
    );
  }
}
