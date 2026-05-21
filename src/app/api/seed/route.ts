import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Provider } from "@/models/Provider";
import { Service } from "@/models/Service";
import { AllocationState } from "@/models/AllocationState";

export const dynamic = "force-dynamic";

export async function POST() {
  await connectDB();

  // Seed Services
  await Service.deleteMany({});
  await Service.insertMany([
    { serviceId: 1, name: "Service 1" },
    { serviceId: 2, name: "Service 2" },
    { serviceId: 3, name: "Service 3" },
  ]);

  // Seed Providers
  await Provider.deleteMany({});
  await Provider.insertMany(
    Array.from({ length: 8 }, (_, i) => ({
      providerId: i + 1,
      name: `Provider ${i + 1}`,
      monthlyQuota: 10,
      leadsReceived: 0,
    }))
  );

  // Seed AllocationState (one per service, starts at -1 for round-robin)
  await AllocationState.deleteMany({});
  await AllocationState.insertMany([
    { serviceId: 1, lastIndex: -1, version: 0 },
    { serviceId: 2, lastIndex: -1, version: 0 },
    { serviceId: 3, lastIndex: -1, version: 0 },
  ]);

  return NextResponse.json({ message: "Seeded successfully" });
}
