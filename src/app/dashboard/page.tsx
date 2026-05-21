"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

interface LeadEntry {
  _id: string;
  customerName: string;
  city: string;
  serviceName: string;
  createdAt: string;
}

interface ProviderData {
  providerId: number;
  name: string;
  monthlyQuota: number;
  leadsReceived: number;
  remaining: number;
  leads: LeadEntry[];
}

export default function Dashboard() {
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sseStatus, setSseStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [selected, setSelected] = useState<number | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const fetchProviders = useCallback(async () => {
    const res = await fetch("/api/providers");
    const data = await res.json();
    setProviders(data);
    setLastUpdate(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProviders();

    // Setup SSE
    const es = new EventSource("/api/events");
    esRef.current = es;

    es.onopen = () => setSseStatus("live");
    es.onerror = () => setSseStatus("error");

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === "NEW_LEAD" || payload.type === "QUOTA_RESET") {
          fetchProviders();
        }
      } catch {}
    };

    return () => {
      es.close();
    };
  }, [fetchProviders]);

  const selectedProvider = providers.find((p) => p.providerId === selected);

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand">⚡ Prowider</Link>
        <Link href="/request-service">Submit Lead</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/test-tools">Test Tools</Link>
      </nav>

      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <div>
            <h1 className="page-title">Provider Dashboard</h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              {lastUpdate && `Last updated: ${lastUpdate}`}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 8 }}>
            <span className="live-indicator">
              <span className={`dot${sseStatus === "live" ? " dot-green" : " dot-red"}`} style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", ...(sseStatus === "live" ? { animation: "pulse 1.5s infinite" } : {}) }} />
              {sseStatus === "live" ? "Live" : sseStatus === "connecting" ? "Connecting…" : "Reconnecting…"}
            </span>
            <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 13 }} onClick={fetchProviders}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <span className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <div className="card" style={{ padding: 20 }}>
                <div className="stat-value">{providers.length}</div>
                <div className="stat-label">Total Providers</div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div className="stat-value">{providers.reduce((s, p) => s + p.leadsReceived, 0)}</div>
                <div className="stat-label">Total Leads Assigned</div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div className="stat-value">{providers.filter((p) => p.remaining > 0).length}</div>
                <div className="stat-label">Providers with Quota</div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div className="stat-value">{providers.reduce((s, p) => s + p.remaining, 0)}</div>
                <div className="stat-label">Total Remaining Quota</div>
              </div>
            </div>

            {/* Provider cards */}
            <div className="grid-4">
              {providers.map((p) => {
                const pct = (p.leadsReceived / p.monthlyQuota) * 100;
                const barClass = pct >= 100 ? "empty" : pct >= 70 ? "low" : "";
                return (
                  <div
                    key={p.providerId}
                    className="card"
                    style={{
                      cursor: "pointer",
                      border: selected === p.providerId ? "1px solid var(--primary)" : "1px solid var(--border)",
                      padding: 18,
                      transition: "border-color 0.15s",
                    }}
                    onClick={() => setSelected(selected === p.providerId ? null : p.providerId)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <span className={`badge ${p.remaining === 0 ? "badge-red" : p.remaining <= 3 ? "badge-yellow" : "badge-green"}`}>
                        {p.remaining === 0 ? "Full" : `${p.remaining} left`}
                      </span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{p.leadsReceived}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>leads received</div>
                    <div className="quota-bar">
                      <div className={`quota-bar-fill ${barClass}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                      {p.leadsReceived} / {p.monthlyQuota} quota used
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lead detail panel */}
            {selectedProvider && (
              <div className="card" style={{ marginTop: 8 }}>
                <div className="card-title">{selectedProvider.name} — Assigned Leads</div>
                {selectedProvider.leads.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No leads assigned yet.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>City</th>
                        <th>Service</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProvider.leads.map((l) => (
                        <tr key={l._id}>
                          <td style={{ fontWeight: 600 }}>{l.customerName}</td>
                          <td>{l.city}</td>
                          <td><span className="badge badge-blue">{l.serviceName}</span></td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {new Date(l.createdAt).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
