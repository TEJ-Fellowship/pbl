import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import AuthForm from './components/AuthForm';
import Home from "./components/Home";
import LandingPage from "./components/LandingPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} /> {/* Landing page route */}
      <Route path="/login" element={<AuthForm mode = "login"/>}/>
      <Route path="/signup" element={<AuthForm mode = "signup"/>}/>
      {/* Redirect root → login */}
      <Route path="/home" element={<Home />} /> {/* new home route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App;
