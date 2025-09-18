import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import AuthForm from './components/AuthForm';
import Home from "./components/Home";
import LandingPage from "./components/LandingPage";
import GalleryPage from "./components/GalleryPage";
import RoomList from "./components/RoomList";

const App = () => {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthForm mode="login" />} />
      <Route path="/signup" element={<AuthForm mode="signup" />} />

      {/* Protected pages (after login) */}
      <Route element={<Layout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/my-room" element={<MyRoomPage />} />
      </Route>


      {/* Catch-all → redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
