import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/trigger/delete - Delete a trigger by ID
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

    const trigger = await db.agentTrigger.findUnique({ where: { id } });
    if (!trigger) {
      return NextResponse.json(
        { error: "Trigger not found" },
        { status: 404 }
      );
    }

    await db.agentTrigger.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete trigger error:", error);
    return NextResponse.json(
      { error: "Failed to delete trigger" },
      { status: 500 }
    );
  }
}
