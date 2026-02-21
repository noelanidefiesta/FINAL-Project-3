import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function Tracks() {
  const { api } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 1, total: 0, per_page: 20 });
  const [form, setForm] = useState({ title: "", artist: "", energy: "", bpm: "", musical_key: "", notes: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", artist: "", energy: "", bpm: "", musical_key: "", notes: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load(nextPage = page, nextQ = q) {
    setLoading(true);
    try {
      const d = await api(`/api/tracks?page=${nextPage}&per_page=20&q=${encodeURIComponent(nextQ)}`);
      setTracks(d.tracks);
      setMeta({ pages: d.pages, total: d.total, per_page: d.per_page });
      setPage(d.page);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, "");
  }, []);

  async function create(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form };
      if (payload.bpm === "") delete payload.bpm;
      await api("/api/tracks", { method: "POST", body: JSON.stringify(payload) });
      setForm({ title: "", artist: "", energy: "", bpm: "", musical_key: "", notes: "" });
      load(1, q);
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditForm({
      title: t.title || "",
      artist: t.artist || "",
      energy: t.energy || "",
      bpm: t.bpm == null ? "" : String(t.bpm),
      musical_key: t.musical_key || "",
      notes: t.notes || "",
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...editForm };
      if (payload.bpm === "") payload.bpm = null;
      await api(`/api/tracks/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
      setEditingId(null);
      load(page, q);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this track?")) return;
    setError("");
    try {
      await api(`/api/tracks/${id}`, { method: "DELETE" });
      load(page, q);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <h2>Tracks</h2>
      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      <form onSubmit={create} style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", marginBottom: 10 }}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <input placeholder="Artist" value={form.artist} onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))} />
        <input placeholder="Energy (warmup/peak/closer)" value={form.energy} onChange={(e) => setForm((f) => ({ ...f, energy: e.target.value }))} />
        <input placeholder="BPM" value={form.bpm} onChange={(e) => setForm((f) => ({ ...f, bpm: e.target.value }))} />
        <input placeholder="Key (ex: 8A)" value={form.musical_key} onChange={(e) => setForm((f) => ({ ...f, musical_key: e.target.value }))} />
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ gridColumn: "1 / -1", minHeight: 60 }} />
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit">Add</button>
        </div>
      </form>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input placeholder="Search title/artist/energy" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} />
        <button onClick={() => load(1, q)}>Search</button>
        <button onClick={() => { setQ(""); load(1, ""); }}>Clear</button>
      </div>

      <div style={{ opacity: 0.8, marginBottom: 10 }}>Total: {meta.total}</div>

      {loading && <div style={{ opacity: 0.8 }}>Loading tracks...</div>}

      {!loading && tracks.map((t) => (
        <div key={t.id} style={{ padding: 12, border: "1px solid #eee", marginBottom: 10 }}>
          {editingId === t.id ? (
            <form onSubmit={saveEdit} style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr" }}>
              <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
              <input value={editForm.artist} onChange={(e) => setEditForm((f) => ({ ...f, artist: e.target.value }))} />
              <input value={editForm.energy} onChange={(e) => setEditForm((f) => ({ ...f, energy: e.target.value }))} />
              <input value={editForm.bpm} onChange={(e) => setEditForm((f) => ({ ...f, bpm: e.target.value }))} />
              <input value={editForm.musical_key} onChange={(e) => setEditForm((f) => ({ ...f, musical_key: e.target.value }))} />
              <textarea value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} style={{ gridColumn: "1 / -1", minHeight: 60 }} />
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  <Link to={`/tracks/${t.id}`} style={{ textDecoration: "none" }}>{t.title}</Link>
                </div>
                <div style={{ opacity: 0.8 }}>
                  {t.artist} {t.energy ? `• ${t.energy}` : ""} {t.bpm != null ? `• ${t.bpm} bpm` : ""} {t.musical_key ? `• ${t.musical_key}` : ""}
                </div>
                {t.notes && <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{t.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => startEdit(t)}>Edit</button>
                <button onClick={() => remove(t.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
        <button disabled={page <= 1} onClick={() => load(page - 1, q)}>Prev</button>
        <div>Page {page} of {meta.pages}</div>
        <button disabled={page >= meta.pages} onClick={() => load(page + 1, q)}>Next</button>
      </div>
    </div>
  );
}
