// ============= FIXED App.jsx =============
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import AuthForm from './components/AuthForm';
import Home from "./components/Home";
import LandingPage from "./components/LandingPage";
import GalleryPage from "./components/GalleryPage";
import RoomList from "./components/RoomList";
import Layout from "./components/Layout";
import RoomPage from "./components/RoomPage";
import { SocketProvider } from "./context/SocketContext";
import axios from "./utils/axios";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        await axios.get("/userRoutes/me");
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <SocketProvider>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/home" replace /> : <AuthForm mode="login" />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/home" replace /> : <AuthForm mode="signup" />
        } />

        {/* Protected pages */}
        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
          <Route path="/home" element={<Home />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/my-room" element={<RoomList />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/"} replace />} />
      </Routes>
    </SocketProvider>
  );
};

export default App;