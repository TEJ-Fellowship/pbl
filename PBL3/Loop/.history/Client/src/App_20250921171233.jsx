import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SocketProvider } from "./SocketProvider";
import AuthForm from "./AuthForm";
import RoomPage from "./RoomPage";
import Home from "./Home"; // your existing canvas/home component

function App() {
  const [user, setUser] = useState(null);

  // fetch user profile per tab if token exists
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
        setUser(null);
      }
    };

    fetchProfile();
  }, []);

  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/home" /> : <AuthForm mode="login" />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/home" /> : <AuthForm mode="signup" />}
          />
          <Route
            path="/home"
            element={user ? <Home /> : <Navigate to="/login" />}
          />
          <Route
            path="/room/:id"
            element={user ? <RoomPage /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to={user ? "/home" : "/login"} />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
