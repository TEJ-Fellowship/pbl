import { useState } from "react";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [page, setPage] = useState("home");

  // Handlers to switch pages
  const handleGoToLogin = () => setPage("login");
  const handleGoToSignup = () => setPage("signup");
  const handleGoToHome = () => setPage("home");

  return (
    <>
      {page === "home" && (
        <Home onLogin={handleGoToLogin} onSignup={handleGoToSignup} />
      )}
      {page === "login" && (
        <Login onSwitchToSignup={handleGoToSignup} onClose={handleGoToHome} />
      )}
      {page === "signup" && (
        <Register onSwitchToLogin={handleGoToLogin} onClose={handleGoToHome} />
      )}
    </>
  );
}

export default App;
