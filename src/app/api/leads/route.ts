import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Lead } from "@/models/Lead";
import { Service } from "@/models/Service";
import { assignProviders } from "@/lib/allocate";
import { emitLeadUpdate } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { customerName, phone, city, serviceId, description } = body;

    if (!customerName || !phone || !city || !serviceId || !description) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const service = await Service.findOne({ serviceId: Number(serviceId) });
    if (!service) {
      return NextResponse.json({ error: "Invalid service" }, { status: 400 });
    }

    // Assign providers (handles concurrency internally)
    const assignedProviders = await assignProviders(Number(serviceId));

    // Save lead — unique index on (phone, serviceId) enforces duplicate rule at DB level
    let lead;
    try {
      lead = await Lead.create({
        customerName,
        phone: phone.trim(),
        city,
        serviceId: Number(serviceId),
        serviceName: service.name,
        description,
        assignedProviders,
      });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        return NextResponse.json(
          { error: "You have already submitted a lead for this service with this phone number." },
          { status: 409 }
        );
      }
      throw err;
    }

    // Emit SSE event for real-time dashboard update
    emitLeadUpdate({
      type: "NEW_LEAD",
      lead: {
        id: lead._id,
        customerName: lead.customerName,
        city: lead.city,
        serviceName: lead.serviceName,
        assignedProviders: lead.assignedProviders,
        createdAt: lead.createdAt,
      },
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (err) {
    console.error("POST /api/leads error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  await connectDB();
  const leads = await Lead.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(leads);
}
