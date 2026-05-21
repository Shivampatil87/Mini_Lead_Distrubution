import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Provider } from "@/models/Provider";
import { Lead } from "@/models/Lead";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();

  const providers = await Provider.find().sort({ providerId: 1 }).lean();
  const leads = await Lead.find().sort({ createdAt: -1 }).lean();

  const result = providers.map((p) => ({
    ...p,
    remaining: p.monthlyQuota - p.leadsReceived,
    leads: leads.filter((l) => l.assignedProviders.includes(p.providerId)),
  }));

  return NextResponse.json(result);
}
