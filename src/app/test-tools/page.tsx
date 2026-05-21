"use client";
import { useState } from "react";
import Link from "next/link";

interface LogEntry {
  time: string;
  msg: string;
  type: "info" | "success" | "error";
}

export default function TestTools() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const log = (msg: string, type: LogEntry["type"] = "info") => {
    const time = new Date().toLocaleTimeString("en-IN");
    setLogs((prev) => [{ time, msg, type }, ...prev].slice(0, 60));
  };

  // ── Webhook: reset quota (idempotent) ───────────────────────────────────
  const sendWebhook = async (eventId: string) => {
    const res = await fetch("/api/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, type: "quota_reset" }),
    });
    const data = await res.json();
    return data;
  };

  const handleQuotaReset = async () => {
    setLoading("reset");
    const eventId = `quota-reset-${Date.now()}`;
    log(`Sending webhook with eventId: ${eventId}`, "info");
    try {
      const data = await sendWebhook(eventId);
      log(`✓ ${data.message}`, "success");
    } catch {
      log("✗ Webhook failed", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleIdempotencyTest = async () => {
    setLoading("idempotency");
    // Send same eventId 5 times simultaneously
    const eventId = `idempotency-test-${Date.now()}`;
    log(`Firing same webhook (${eventId}) 5× simultaneously…`, "info");

    try {
      const results = await Promise.all(
        Array(5).fill(null).map(() => sendWebhook(eventId))
      );
      const processed = results.filter((r) => !r.alreadyProcessed).length;
      const skipped = results.filter((r) => r.alreadyProcessed).length;
      log(`✓ Processed: ${processed}× | Skipped (idempotent): ${skipped}×`, "success");
      if (processed <= 1) {
        log("✓ Idempotency working correctly — quota reset only once", "success");
      } else {
        log("✗ Idempotency issue detected!", "error");
      }
    } catch {
      log("✗ Test failed", "error");
    } finally {
      setLoading(null);
    }
  };

  // ── Concurrency test: 10 leads simultaneously ───────────────────────────
  const handleConcurrencyTest = async () => {
    setLoading("concurrency");
    log("Generating 10 leads simultaneously…", "info");

    const names = ["Rahul", "Priya", "Amit", "Sneha", "Raj", "Meena", "Anil", "Pooja", "Suresh", "Divya"];
    const cities = ["Nagpur", "Mumbai", "Pune", "Delhi", "Hyderabad", "Chennai", "Bangalore", "Kolkata", "Jaipur", "Surat"];

    const requests = names.map((name, i) => ({
      customerName: `${name} Test`,
      phone: `99${String(i).padStart(8, "0")}`,
      city: cities[i],
      serviceId: (i % 3) + 1,
      description: "Concurrency test lead",
    }));

    try {
      const results = await Promise.all(
        requests.map((body) =>
          fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).then((r) => r.json())
        )
      );

      let ok = 0, fail = 0;
      for (const r of results) {
        if (r.success) {
          ok++;
          log(`✓ Lead created → providers: [${r.lead.assignedProviders.join(", ")}]`, "success");
        } else {
          fail++;
          log(`✗ Failed: ${r.error}`, "error");
        }
      }
      log(`Done — ${ok} created, ${fail} failed`, ok === 10 ? "success" : "info");
    } catch {
      log("✗ Concurrency test failed", "error");
    } finally {
      setLoading(null);
    }
  };

  // ── Seed DB ─────────────────────────────────────────────────────────────
  const handleSeed = async () => {
    setLoading("seed");
    log("Seeding database…", "info");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      log(`✓ ${data.message}`, "success");
    } catch {
      log("✗ Seed failed", "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand">⚡ Prowider</Link>
        <Link href="/request-service">Submit Lead</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/test-tools">Test Tools</Link>
      </nav>

      <div className="container" style={{ maxWidth: 860 }}>
        <h1 className="page-title">Test Tools</h1>
        <p className="page-subtitle">Simulate payment webhooks, test idempotency, and stress-test concurrency.</p>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Webhook Panel */}
          <div className="card">
            <div className="card-title">🔔 Webhook Simulation</div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Simulates a payment gateway confirming provider subscription. Quota reset ONLY happens through this webhook.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="btn btn-success"
                onClick={handleQuotaReset}
                disabled={!!loading}
              >
                {loading === "reset" ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Resetting…</> : "↺ Reset All Provider Quotas"}
              </button>
              <button
                className="btn btn-warning"
                onClick={handleIdempotencyTest}
                disabled={!!loading}
              >
                {loading === "idempotency" ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Testing…</> : "⚡ Fire Same Webhook 5× (Idempotency Test)"}
              </button>
            </div>
          </div>

          {/* Concurrency Panel */}
          <div className="card">
            <div className="card-title">🚀 Concurrency Testing</div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Fires 10 lead submissions simultaneously across all 3 services. Verifies round-robin allocation and quota handling under load.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={handleConcurrencyTest}
                disabled={!!loading}
              >
                {loading === "concurrency" ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Generating…</> : "⚡ Generate 10 Leads Simultaneously"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={handleSeed}
                disabled={!!loading}
              >
                {loading === "seed" ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Seeding…</> : "🌱 Re-Seed Database (Reset Everything)"}
              </button>
            </div>
          </div>
        </div>

        {/* Log console */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>📋 Activity Log</div>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setLogs([])}>
              Clear
            </button>
          </div>
          <div
            style={{
              background: "var(--bg)",
              borderRadius: 8,
              padding: 16,
              minHeight: 180,
              maxHeight: 320,
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            {logs.length === 0 ? (
              <span style={{ color: "var(--text-muted)" }}>Run a test to see results here…</span>
            ) : (
              logs.map((l, i) => (
                <div
                  key={i}
                  style={{
                    color:
                      l.type === "success"
                        ? "var(--success)"
                        : l.type === "error"
                        ? "#ef4444"
                        : "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "var(--text-muted)", marginRight: 8 }}>[{l.time}]</span>
                  {l.msg}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info box */}
        <div className="alert alert-info">
          <strong>How idempotency works:</strong> Every webhook call includes an <code>eventId</code>. The system stores processed event IDs in MongoDB with a unique index. Duplicate calls with the same <code>eventId</code> are detected and silently skipped — quota is only reset once.
        </div>
      </div>
    </>
  );
}
