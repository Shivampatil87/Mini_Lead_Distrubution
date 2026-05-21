import mongoose from "mongoose";
import { Provider } from "@/models/Provider";
import { AllocationState } from "@/models/AllocationState";

// ─── Mandatory providers per service ───────────────────────────────────────
export const MANDATORY: Record<number, number[]> = {
  1: [1],
  2: [5],
  3: [1, 4],
};

// ─── Fair pool per service ──────────────────────────────────────────────────
export const FAIR_POOL: Record<number, number[]> = {
  1: [2, 3, 4],
  2: [6, 7, 8],
  3: [2, 3, 5, 6, 7, 8],
};

const TOTAL_SLOTS = 3;
const MAX_RETRIES = 10;

/**
 * Assigns exactly 3 providers to a lead using:
 * 1. Mandatory providers (if quota available)
 * 2. Round-robin fair allocation from pool (persisted in DB)
 *
 * Uses optimistic concurrency (version field) to handle simultaneous lead creation.
 */
export async function assignProviders(serviceId: number): Promise<number[]> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await attemptAssignment(serviceId);
      if (result) return result;
    } catch (err: unknown) {
      // Retry on version conflict
      if (isVersionConflict(err)) {
        await sleep(20 + Math.random() * 30);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Could not assign providers after max retries");
}

async function attemptAssignment(serviceId: number): Promise<number[] | null> {
  // Load current allocation state
  const state = await AllocationState.findOne({ serviceId });
  if (!state) throw new Error(`AllocationState missing for service ${serviceId}`);

  const mandatory = MANDATORY[serviceId] ?? [];
  const pool = FAIR_POOL[serviceId] ?? [];
  const slotsNeeded = TOTAL_SLOTS - mandatory.length;

  // Load all providers with quota info in one query
  const allProviderIds = Array.from(new Set([...mandatory, ...pool]));
  const providers = await Provider.find(
    { providerId: { $in: allProviderIds } },
    { providerId: 1, monthlyQuota: 1, leadsReceived: 1 }
  ).lean();

  const quotaMap = new Map<number, number>();
  for (const p of providers) {
    quotaMap.set(p.providerId, p.monthlyQuota - p.leadsReceived);
  }

  // Assign mandatory providers (skip if quota exhausted)
  const assigned: number[] = [];
  for (const pid of mandatory) {
    const remaining = quotaMap.get(pid) ?? 0;
    if (remaining > 0) {
      assigned.push(pid);
    }
  }

  // Fill remaining slots with round-robin from pool
  const currentIndex = state.lastIndex;
  let nextIndex = currentIndex;
  let poolChecked = 0;

  while (assigned.length < TOTAL_SLOTS && poolChecked < pool.length) {
    nextIndex = (nextIndex + 1) % pool.length;
    poolChecked++;

    const candidateId = pool[nextIndex];
    if (assigned.includes(candidateId)) continue; // already mandatory

    const remaining = quotaMap.get(candidateId) ?? 0;
    if (remaining > 0) {
      assigned.push(candidateId);
    }
  }

  if (assigned.length < TOTAL_SLOTS) {
    // Not enough providers with quota — assign as many as possible
    console.warn(`Only ${assigned.length} providers available for service ${serviceId}`);
  }

  // Atomically update allocation state using optimistic concurrency
  const updateResult = await AllocationState.updateOne(
    { serviceId, version: state.version },
    { $set: { lastIndex: nextIndex }, $inc: { version: 1 } }
  );

  if (updateResult.modifiedCount === 0) {
    // Another request updated state concurrently — retry
    return null;
  }

  // Increment leadsReceived for each assigned provider
  if (assigned.length > 0) {
    await Provider.updateMany(
      { providerId: { $in: assigned } },
      { $inc: { leadsReceived: 1 } }
    );
  }

  return assigned;
}

function isVersionConflict(err: unknown): boolean {
  if (err instanceof mongoose.Error) return true;
  // null result from updateOne means conflict
  return false;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
