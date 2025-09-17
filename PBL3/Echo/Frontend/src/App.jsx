import { useState } from "react";
import Recorder from "./Components/Recorder";
import LoginForm from "./Pages/LoginPage.jsx";
import HomePage from "./Pages/HomePage.jsx";
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
          element={
            isLoggedIn ? (
              <Navigate to="/home" />
            ) : (
              <LoginForm setIsLoggedIn={setIsLoggedIn} />
            )
          }
        />
        <Route
          path="/home"
          element={
            isLoggedIn ? (
              <HomePage setIsLoggedIn={setIsLoggedIn} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/rooms"
          element={
            isLoggedIn ? (
              <RoomsPage setIsLoggedIn={setIsLoggedIn} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="/rooms/:id" element={<RoomChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
