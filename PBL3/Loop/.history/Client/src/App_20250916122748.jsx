import React, { useState } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import AuthForm from './components/AuthForm';
import Home from "./components/Home";
import LandingPage from "./components/LandingPage";
import GalleryPage from "./components/GalleryPage";
import RoomList from "./components/RoomList";
import Layout from "./components/Layout";
import RoomPage from "./components/RoomPage";
import { SocketProvider } from "./context/SocketContext";

const App = () => {
  const [userToken, setUserToken] = useState(null); // store JWT after login

  return (
    <SocketProvider>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthForm mode="login" onLogin={setUserToken} />} />
        <Route path="/signup" element={<AuthForm mode="signup" onLogin={setUserToken} />} />

        {/* Protected pages (after login) */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home userToken={userToken} />} />
          <Route path="/gallery" element={<GalleryPage userToken={userToken} />} />
          <Route path="/my-room" element={<RoomList userToken={userToken} />} />
          <Route path="/room/:id" element={<RoomPage userToken={userToken} />} />
        </Route>

        {/* Catch-all → redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </SocketProvider>
  );
};

export default App;
