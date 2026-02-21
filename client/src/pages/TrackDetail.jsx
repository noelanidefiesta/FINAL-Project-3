import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function TrackDetail() {
  const { id } = useParams();
  const trackId = Number(id);
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const d = await api(`/api/tracks/${trackId}/usage`);
      setData(d);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [trackId]);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!data) {
    return (
      <div style={{ padding: 24 }}>
        {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>Track not found.</div>
        <Link to="/tracks">Back</Link>
      </div>
    );
  }

  const { track, usage, last_played } = data;

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>{track.title}</h2>
          <div style={{ opacity: 0.8, marginTop: 4 }}>
            {track.artist}
            {track.energy ? ` • ${track.energy}` : ""}
            {track.bpm != null ? ` • ${track.bpm} bpm` : ""}
            {track.musical_key ? ` • ${track.musical_key}` : ""}
          </div>
          {last_played && <div style={{ marginTop: 8 }}>Last played: {last_played}</div>}
        </div>
        <Link to="/tracks">Back to Tracks</Link>
      </div>

      {track.notes && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #eee", whiteSpace: "pre-wrap" }}>
          {track.notes}
        </div>
      )}

      <h3 style={{ marginTop: 22 }}>Where you played it</h3>
      {usage.length === 0 && <div style={{ opacity: 0.8 }}>No usage yet. Add this track to a set.</div>}

      {usage.map((u) => (
        <div key={u.set_item_id} style={{ padding: 12, border: "1px solid #eee", marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>
            <Link to={`/sets/${u.set_id}`} style={{ textDecoration: "none" }}>{u.set_name}</Link>
            <span style={{ opacity: 0.8 }}> • position {u.position + 1}</span>
          </div>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            {u.gig ? (
              <>
                {u.gig.title}{u.gig.venue ? ` • ${u.gig.venue}` : ""}{u.gig.gig_date ? ` • ${u.gig.gig_date}` : ""}
              </>
            ) : (
              <>No gig linked to this set</>
            )}
          </div>
          {u.gig?.notes && <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{u.gig.notes}</div>}
        </div>
      ))}
    </div>
  );
}
