import React, { useEffect, useState } from "react";
import { useAuth } from "../state/auth.jsx";

export default function Gigs() {
  const { api } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [form, setForm] = useState({ title: "", venue: "", gig_date: "", notes: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", venue: "", gig_date: "", notes: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await api("/api/gigs");
      setGigs(d.gigs);
    } catch {
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/gigs", { method: "POST", body: JSON.stringify(form) });
      setForm({ title: "", venue: "", gig_date: "", notes: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(g) {
    setEditingId(g.id);
    setEditForm({ title: g.title || "", venue: g.venue || "", gig_date: g.gig_date || "", notes: g.notes || "" });
  }

  async function saveEdit(e) {
    e.preventDefault();
    setError("");
    try {
      await api(`/api/gigs/${editingId}`, { method: "PATCH", body: JSON.stringify(editForm) });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this gig?")) return;
    setError("");
    try {
      await api(`/api/gigs/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2>Gigs</h2>
      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      <form onSubmit={create} style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 2fr 1fr", marginBottom: 10 }}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <input placeholder="Venue" value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} />
        <input placeholder="YYYY-MM-DD" value={form.gig_date} onChange={(e) => setForm((f) => ({ ...f, gig_date: e.target.value }))} />
        <textarea placeholder="Notes (what worked, what didn't)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ gridColumn: "1 / -1", minHeight: 64 }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gridColumn: "1 / -1" }}>
          <button type="submit">Add</button>
        </div>
      </form>

      {loading && <div style={{ opacity: 0.8 }}>Loading gigs...</div>}
      {!loading && gigs.length === 0 && <div style={{ opacity: 0.8 }}>No gigs yet.</div>}

      {gigs.map((g) => (
        <div key={g.id} style={{ padding: 12, border: "1px solid #eee", marginBottom: 10 }}>
          {editingId === g.id ? (
            <form onSubmit={saveEdit} style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 2fr 1fr" }}>
              <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
              <input value={editForm.venue} onChange={(e) => setEditForm((f) => ({ ...f, venue: e.target.value }))} />
              <input value={editForm.gig_date} onChange={(e) => setEditForm((f) => ({ ...f, gig_date: e.target.value }))} />
              <textarea value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} style={{ gridColumn: "1 / -1", minHeight: 64 }} />
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{g.title}</div>
                <div style={{ opacity: 0.8 }}>
                  {g.venue || "No venue"} {g.gig_date ? `• ${g.gig_date}` : ""}
                </div>
                {g.notes && <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{g.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <button onClick={() => startEdit(g)}>Edit</button>
                <button onClick={() => remove(g.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
