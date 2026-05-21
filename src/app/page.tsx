import Link from "next/link";

export default function Home() {
  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand">⚡ Prowider</Link>
        <Link href="/request-service">Submit Lead</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/test-tools">Test Tools</Link>
      </nav>

      <div className="container" style={{ maxWidth: 700, paddingTop: 64 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 className="page-title" style={{ fontSize: 36 }}>
            Mini Lead Distribution System
          </h1>
          <p className="page-subtitle" style={{ fontSize: 16, marginBottom: 40 }}>
            Automated lead assignment with fair allocation, real-time updates, and quota management.
          </p>
        </div>

        <div className="grid-3" style={{ gap: 20 }}>
          <Link href="/request-service" style={{ textDecoration: "none" }}>
            <div className="card" style={{ textAlign: "center", cursor: "pointer", transition: "border-color 0.15s" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Submit Enquiry</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Customer service request form</div>
            </div>
          </Link>

          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <div className="card" style={{ textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Provider Dashboard</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Real-time lead tracking</div>
            </div>
          </Link>

          <Link href="/test-tools" style={{ textDecoration: "none" }}>
            <div className="card" style={{ textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🧪</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Test Tools</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Concurrency & webhook testing</div>
            </div>
          </Link>
        </div>

        <div className="card" style={{ marginTop: 32 }}>
          <div className="card-title">Assignment Rules</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Service 1</div>
              <div><span className="badge badge-purple">P1</span> mandatory</div>
              <div style={{ color: "var(--text-muted)", marginTop: 4 }}>Pool: P2, P3, P4</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Service 2</div>
              <div><span className="badge badge-blue">P5</span> mandatory</div>
              <div style={{ color: "var(--text-muted)", marginTop: 4 }}>Pool: P6, P7, P8</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Service 3</div>
              <div><span className="badge badge-purple">P1</span> <span className="badge badge-yellow">P4</span> mandatory</div>
              <div style={{ color: "var(--text-muted)", marginTop: 4 }}>Pool: P2, P3, P5, P6, P7, P8</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
