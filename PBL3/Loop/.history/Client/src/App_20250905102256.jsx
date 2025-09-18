import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import AuthForm from './components/AuthForm';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<AuthForm mode = "login"/>}/>
      <Route path="/signup" element={<AuthForm mode = "signup"/>}/>
      {/* Redirect root → login */}
      <Route path ="*" element={<Navigate to "/"}/>
    </Routes>
  )
}

export default App
