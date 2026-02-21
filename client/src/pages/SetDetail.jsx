import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function SetDetail() {
  const { id } = useParams();
  const setId = Number(id);
  const { api } = useAuth();
  const nav = useNavigate();

  const [setObj, setSetObj] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [trackId, setTrackId] = useState("");
  const [edit, setEdit] = useState({ name: "", notes: "", gig_id: "" });
  const [savingMeta, setSavingMeta] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await api(`/api/sets/${setId}`);
      setSetObj(d);
      setEdit({ name: d.name || "", notes: d.notes || "", gig_id: d.gig_id == null ? "" : String(d.gig_id) });
    } catch {
      setSetObj(null);
    } finally {
      setLoading(false);
    }

    api(`/api/tracks?per_page=100`).then((d) => setTracks(d.tracks)).catch(() => setTracks([]));
    api(`/api/gigs`).then((d) => setGigs(d.gigs)).catch(() => setGigs([]));
  }

  useEffect(() => {
    load();
  }, [setId]);

  const items = useMemo(() => setObj?.items || [], [setObj]);

  async function saveMeta(e) {
    e.preventDefault();
    setError("");
    setSavingMeta(true);
    try {
      const payload = { name: edit.name, notes: edit.notes };
      payload.gig_id = edit.gig_id === "" ? null : Number(edit.gig_id);
      await api(`/api/sets/${setId}`, { method: "PATCH", body: JSON.stringify(payload) });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingMeta(false);
    }
  }

  async function addItem(e) {
    e.preventDefault();
    setError("");
    if (!trackId) return;
    try {
      await api(`/api/sets/${setId}/items`, { method: "POST", body: JSON.stringify({ track_id: Number(trackId) }) });
      setTrackId("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeSet() {
    if (!confirm("Delete this set?")) return;
    setError("");
    try {
      await api(`/api/sets/${setId}`, { method: "DELETE" });
      nav("/sets");
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeItem(itemId) {
    setError("");
    try {
      await api(`/api/sets/${setId}/items/${itemId}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function move(itemId, dir) {
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    const next = [...items];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    const temp = next[idx];
    next[idx] = next[swapIdx];
    next[swapIdx] = temp;
    const order = next.map((i) => i.id);
    await api(`/api/sets/${setId}/items/reorder`, { method: "PUT", body: JSON.stringify({ order }) });
    load();
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!setObj) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 12 }}>Set not found.</div>
        <Link to="/sets">Back</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{setObj.name}</h2>
        <button onClick={removeSet}>Delete set</button>
      </div>

      {error && <div style={{ color: "crimson", marginTop: 12 }}>{error}</div>}

      <form onSubmit={saveMeta} style={{ marginTop: 16, padding: 12, border: "1px solid #eee", display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ opacity: 0.8 }}>Set name</span>
            <input value={edit.name} onChange={(e) => setEdit((x) => ({ ...x, name: e.target.value }))} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ opacity: 0.8 }}>Notes</span>
            <textarea value={edit.notes} onChange={(e) => setEdit((x) => ({ ...x, notes: e.target.value }))} style={{ minHeight: 60 }} />
          </label>
        </div>

        <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ opacity: 0.8 }}>Linked gig</span>
            <select value={edit.gig_id} onChange={(e) => setEdit((x) => ({ ...x, gig_id: e.target.value }))}>
              <option value="">No gig</option>
              {gigs.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}{g.gig_date ? ` (${g.gig_date})` : ""}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={savingMeta}>{savingMeta ? "Saving..." : "Save details"}</button>
        </div>
      </form>

      <form onSubmit={addItem} style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <select value={trackId} onChange={(e) => setTrackId(e.target.value)} style={{ flex: 1 }}>
          <option value="">Add a track...</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} - {t.artist}
            </option>
          ))}
        </select>
        <button type="submit">Add</button>
      </form>

      <h3 style={{ marginTop: 22 }}>Set Order</h3>

      {items.length === 0 && <div style={{ opacity: 0.8 }}>No tracks added yet.</div>}

      {items.map((i, idx) => (
        <div key={i.id} style={{ padding: 12, border: "1px solid #eee", marginBottom: 10, display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{i.track?.title || "Track"}</div>
            <div style={{ opacity: 0.8 }}>
              {i.track?.artist || ""} {i.track?.energy ? `• ${i.track.energy}` : ""}
              {i.track?.bpm != null ? `• ${i.track.bpm} bpm` : ""}
              {i.track?.musical_key ? `• ${i.track.musical_key}` : ""}
            </div>
          </div>
          <button disabled={idx === 0} onClick={() => move(i.id, -1)}>Up</button>
          <button disabled={idx === items.length - 1} onClick={() => move(i.id, 1)}>Down</button>
          <button onClick={() => removeItem(i.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
