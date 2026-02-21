import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function Sets() {
  const { api } = useAuth();
  const [sets, setSets] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await api("/api/sets");
      setSets(d.sets);
    } catch {
      setSets([]);
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
      await api("/api/sets", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(s) {
    setEditingId(s.id);
    setEditName(s.name || "");
  }

  async function saveEdit(e) {
    e.preventDefault();
    setError("");
    try {
      await api(`/api/sets/${editingId}`, { method: "PATCH", body: JSON.stringify({ name: editName }) });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this set?")) return;
    setError("");
    try {
      await api(`/api/sets/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2>Sets</h2>
      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      <form onSubmit={create} style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <input placeholder="Set name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ flex: 1 }} />
        <button type="submit">Add</button>
      </form>

      {loading && <div style={{ opacity: 0.8 }}>Loading sets...</div>}

      {!loading && sets.map((s) => (
        <div key={s.id} style={{ padding: 12, border: "1px solid #eee", marginBottom: 10, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            {editingId === s.id ? (
              <form onSubmit={saveEdit} style={{ display: "flex", gap: 10 }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ flex: 1 }} />
                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                <button type="submit">Save</button>
              </form>
            ) : (
              <>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  <Link to={`/sets/${s.id}`}>Open</Link>
                  <button onClick={() => startEdit(s)}>Edit</button>
                </div>
              </>
            )}
          </div>
          <button onClick={() => remove(s.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
