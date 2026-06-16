import { addEventListener, removeEventListener } from "@/lib/agent/agent";
import { AgentEvent } from "@/lib/agent/types";
import { NextRequest } from "next/server";

// GET /api/agent/stream?runId=xxx - SSE stream for agent events
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get("runId");

  if (!runId) {
    return new Response("runId is required", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: AgentEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream may be closed
        }
      };

      // Send initial connection event
      send({ type: "status", message: "Connected to agent stream" });

      // Listen for agent events
      const listener = (event: AgentEvent) => {
        send(event);

        // Close stream when agent is done
        if (event.type === "done") {
          setTimeout(() => {
            removeEventListener(runId, listener);
            try {
              controller.close();
            } catch {
              // Already closed
            }
          }, 100);
        }
      };

      addEventListener(runId, listener);

      // Keep-alive ping every 15 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:keepalive\n\n`));
        } catch {
          clearInterval(keepAlive);
          removeEventListener(runId, listener);
        }
      }, 15000);

      // Clean up on close
      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        removeEventListener(runId, listener);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
