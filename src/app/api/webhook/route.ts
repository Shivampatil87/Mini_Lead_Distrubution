import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Provider } from "@/models/Provider";
import { WebhookEvent } from "@/models/WebhookEvent";
import { emitLeadUpdate } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { eventId, type } = body;

    if (!eventId || type !== "quota_reset") {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    // ── Idempotency check ──────────────────────────────────────────────────
    // If we've already processed this eventId, return 200 without re-processing
    const existing = await WebhookEvent.findOne({ eventId });
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already processed (idempotent)",
        alreadyProcessed: true,
      });
    }

    // Mark event as processed FIRST (prevents duplicate processing under concurrency)
    try {
      await WebhookEvent.create({ eventId, type });
    } catch (err: unknown) {
      // Duplicate key = another request processed it simultaneously
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        return NextResponse.json({
          success: true,
          message: "Already processed (idempotent)",
          alreadyProcessed: true,
        });
      }
      throw err;
    }

    // Reset all provider quotas to 10
    await Provider.updateMany({}, { $set: { monthlyQuota: 10, leadsReceived: 0 } });

    // Notify dashboard in real time
    emitLeadUpdate({ type: "QUOTA_RESET" });

    return NextResponse.json({ success: true, message: "Quota reset successfully" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
