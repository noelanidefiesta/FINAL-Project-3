import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function Dashboard() {
  const { api } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [sets, setSets] = useState([]);

  useEffect(() => {
    api("/api/gigs").then((d) => setGigs(d.gigs)).catch(() => setGigs([]));
    api("/api/sets").then((d) => setSets(d.sets)).catch(() => setSets([]));
  }, [api]);

  return (
    <div style={{ padding: 24, display: "grid", gap: 24, gridTemplateColumns: "1fr 1fr" }}>
      <div>
        <h3>Recent Gigs</h3>
        {gigs.slice(0, 5).map((g) => (
          <div key={g.id} style={{ padding: 12, border: "1px solid #eee", marginBottom: 10 }}>
            <div style={{ fontWeight: 600 }}>{g.title}</div>
            <div style={{ opacity: 0.8 }}>{g.venue || "No venue"} {g.gig_date ? `• ${g.gig_date}` : ""}</div>
          </div>
        ))}
        <Link to="/gigs">Manage gigs</Link>
      </div>

      <div>
        <h3>Recent Sets</h3>
        {sets.slice(0, 5).map((s) => (
          <div key={s.id} style={{ padding: 12, border: "1px solid #eee", marginBottom: 10 }}>
            <div style={{ fontWeight: 600 }}>{s.name}</div>
            <div style={{ opacity: 0.8 }}>{s.gig_id ? `Linked to gig #${s.gig_id}` : "No gig linked"}</div>
            <Link to={`/sets/${s.id}`}>Open</Link>
          </div>
        ))}
        <Link to="/sets">Manage sets</Link>
      </div>
    </div>
  );
}
