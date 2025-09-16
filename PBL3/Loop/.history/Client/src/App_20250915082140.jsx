import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AuthForm from "./components/AuthForm";
import Home from "./components/Home";
import LandingPage from "./components/LandingPage";
import GalleryPage from "./components/GalleryPage";
import RoomList from "./components/RoomList";
import Layout from "./components/Layout";
import RoomPage from "./components/RoomPage";
import { SocketProvider } from "./context/SocketContext";

const App = () => {
  const [user, setUser] = useState(null);

  // Load token + username on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    if (token && username) {
      setUser({ username, token });
    }
  }, []);

  // Handle login from AuthForm
  const handleLogin = (username, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    setUser({ username, token });
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
  };

  return (
    <SocketProvider>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthForm mode="login" onLogin={handleLogin} />} />
        <Route path="/signup" element={<AuthForm mode="signup" onLogin={handleLogin} />} />

        {/* Protected pages (need auth) */}
        {user ? (
          <Route
            element={<Layout user={user} onLogout={handleLogout} />}
          >
            <Route path="/home" element={<Home />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/my-room" element={<RoomList />} />
            <Route path="/room/:id" element={<RoomPage />} />
          </Route>
        ) : (
          // If not logged in → redirect all protected pages to login
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}

        {/* Catch-all when logged in */}
        {user && <Route path="*" element={<Navigate to="/home" replace />} />}
      </Routes>
    </SocketProvider>
  );
};

export default App;
