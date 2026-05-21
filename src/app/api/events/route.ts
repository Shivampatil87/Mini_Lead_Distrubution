import { NextResponse } from "next/server";
import { sseEmitter } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial heartbeat
      controller.enqueue(encoder.encode("data: {\"type\":\"connected\"}\n\n"));

      const onUpdate = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          sseEmitter.off("lead-update", onUpdate);
        }
      };

      sseEmitter.on("lead-update", onUpdate);

      // Heartbeat every 25s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode("data: {\"type\":\"heartbeat\"}\n\n"));
        } catch {
          clearInterval(heartbeat);
          sseEmitter.off("lead-update", onUpdate);
        }
      }, 25000);

      // Cleanup on close
      const cleanup = () => {
        clearInterval(heartbeat);
        sseEmitter.off("lead-update", onUpdate);
      };

      // Store cleanup on controller for later
      (controller as unknown as { _cleanup: () => void })._cleanup = cleanup;
    },
    cancel() {
      // Called when client disconnects
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
