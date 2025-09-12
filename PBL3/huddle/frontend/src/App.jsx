import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null); // Store logged-in user

  // On mount, check for token and set user if present
  useEffect(() => {
    const token = Cookies.get("token");
    if (token && !user) {
      // Decode JWT to get username (no backend call for simplicity)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          username: payload.email?.split("@")[0] || payload.email || "User",
        });
      } catch (e) {
        // Invalid token, ignore
      }
    }
  }, []);

  // Handlers to switch pages
  const handleGoToLogin = () => setPage("login");
  const handleGoToSignup = () => setPage("signup");
  const handleGoToHome = () => setPage("home");

  // Handle login success: set user and go home
  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
    setPage("home");
  };

  // Logout handler
  const handleLogout = () => {
    Cookies.remove("token");
    setUser(null);
    setPage("home");
  };

  return (
    <>
      {page === "home" && (
        <Home
          onLogin={handleGoToLogin}
          onSignup={handleGoToSignup}
          username={user?.username}
          onLogout={user ? handleLogout : undefined}
        />
      )}
      {page === "login" && (
        <Login
          onSwitchToSignup={handleGoToSignup}
          onClose={handleGoToHome}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {page === "signup" && (
        <Register onSwitchToLogin={handleGoToLogin} onClose={handleGoToHome} />
      )}
      <ToastContainer position="top-center" autoClose={2000} />
    </>
  );
}

export default App;
