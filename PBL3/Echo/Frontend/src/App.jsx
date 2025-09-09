import { useState } from "react";
import Recorder from "./Components/Recorder";
import LoginForm from "./Pages/LoginPage.jsx";
import HomePage from "./Pages/HomePage.jsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
