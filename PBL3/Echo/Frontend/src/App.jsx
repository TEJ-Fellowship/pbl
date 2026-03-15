// src/App.jsx
import { useState } from "react";
import HomePage from "./Pages/HomePage.jsx";
import LoginForm from "./Pages/LoginPage.jsx";
import LandingPage from "./Pages/LandingPage.jsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoomsPage from "./features/rooms/RoomsPage.jsx";
import RoomChatPage from "./features/rooms/RoomChatPage.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/home" /> : <LandingPage />}
        />
        <Route
          path="/login"
          element={<LoginForm setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route
          path="/home"
          element={
            isLoggedIn ? (
              <HomePage setIsLoggedIn={setIsLoggedIn} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/rooms"
          element={
            isLoggedIn ? (
              <RoomsPage setIsLoggedIn={setIsLoggedIn} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/rooms/:id"
          element={isLoggedIn ? <RoomChatPage /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
