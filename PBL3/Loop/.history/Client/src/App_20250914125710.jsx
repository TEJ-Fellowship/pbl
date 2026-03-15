import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import AuthForm from './components/AuthForm';
import Home from "./components/Home";
import LandingPage from "./components/LandingPage";
import GalleryPage from "./components/GalleryPage";
import MyRoomPage from "./components/MyRoomPage";
import Layout from "./components/Layout";

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthForm mode="login" />} />
      <Route path="/signup" element={<AuthForm mode="signup" />} />

      {/* Protected routes with persistent Navbar */}
      <Route element={<Layout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/my-room" element={<MyRoomPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
