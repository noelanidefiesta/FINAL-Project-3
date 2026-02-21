import React from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./state/auth.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tracks from "./pages/Tracks.jsx";
import TrackDetail from "./pages/TrackDetail.jsx";
import Sets from "./pages/Sets.jsx";
import SetDetail from "./pages/SetDetail.jsx";
import Gigs from "./pages/Gigs.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function Nav() {
  const { user, logout } = useAuth();
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", padding: 16, borderBottom: "1px solid #eee" }}>
      <Link to="/">SetList Studio</Link>
      {user && (
        <>
          <Link to="/gigs">Gigs</Link>
          <Link to="/sets">Sets</Link>
          <Link to="/tracks">Tracks</Link>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <span>{user.username}</span>
            <button onClick={logout}>Logout</button>
          </div>
        </>
      )}
      {!user && (
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <Link to="/login">Login</Link>
          <Link to="/signup">Signup</Link>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  return (
    <div>
      <Nav />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/gigs"
          element={
            <Protected>
              <Gigs />
            </Protected>
          }
        />
        <Route
          path="/tracks"
          element={
            <Protected>
              <Tracks />
            </Protected>
          }
        />

        <Route
          path="/tracks/:id"
          element={
            <Protected>
              <TrackDetail />
            </Protected>
          }
        />
        <Route
          path="/sets"
          element={
            <Protected>
              <Sets />
            </Protected>
          }
        />
        <Route
          path="/sets/:id"
          element={
            <Protected>
              <SetDetail />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to={loading || user ? "/" : "/login"} replace />} />
      </Routes>
    </div>
  );
}
