/**
 * POST /api/hermes/stop
 *
 * Stop a running Hermes causal execution run.
 */

import { NextRequest, NextResponse } from "next/server";
import { getKernel } from "@/lib/hermes/kernel-spine";
import { createRunId } from "@/lib/hermes/event-dsl/constructors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId } = body;

    if (!runId) {
      return NextResponse.json(
        { error: "runId is required" },
        { status: 400 }
      );
    }

    const kernel = getKernel();
    kernel.stop(createRunId(runId));

    return NextResponse.json({
      runId,
      status: "stopped",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
