"use client";
import { useState } from "react";
import Link from "next/link";

export default function RequestService() {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    city: "",
    serviceId: "",
    description: "",
  });
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", msg: data.error ?? "Something went wrong." });
      } else {
        setStatus({
          type: "success",
          msg: `Lead submitted! Assigned to providers: ${data.lead.assignedProviders.join(", ")}`,
        });
        setForm({ customerName: "", phone: "", city: "", serviceId: "", description: "" });
      }
    } catch {
      setStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setLoading(false);
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

      <div className="container" style={{ maxWidth: 560 }}>
        <h1 className="page-title">Request a Service</h1>
        <p className="page-subtitle">Fill in your details and we'll connect you with the right providers.</p>

        {status && (
          <div className={`alert ${status.type === "error" ? "alert-error" : "alert-success"}`}>
            {status.msg}
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                placeholder="e.g. Rahul Sharma"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                pattern="[0-9]{10}"
                title="Enter a valid 10-digit phone number"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">City</label>
              <input
                className="form-input"
                placeholder="e.g. Nagpur"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Service Type</label>
              <select
                className="form-select"
                value={form.serviceId}
                onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                required
              >
                <option value="">Select a service…</option>
                <option value="1">Service 1</option>
                <option value="2">Service 2</option>
                <option value="3">Service 3</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe your requirements…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Submitting…</> : "Submit Enquiry"}
            </button>
          </form>
        </div>

        <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          The same phone number cannot submit the same service type more than once.
        </p>
      </div>
    </>
  );
}
