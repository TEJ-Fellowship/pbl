import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

function App() {
  // Try to restore page from localStorage, default to 'home'
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem("page");
    return saved || "home";
  });
  const [user, setUser] = useState(null); // Store logged-in user

  // On mount, check for token and set user if present
  useEffect(() => {
    const token = Cookies.get("token");
    if (token && !user) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          username: payload.email?.split("@")[0] || payload.email || "User",
        });
        // If last page was chat or user is logged in, go to chat
        setPage((prev) => (prev === "chat" ? "chat" : "home"));
      } catch (e) {
        // Invalid token, ignore
      }
    }
  }, []);

  // Persist page in localStorage
  useEffect(() => {
    localStorage.setItem("page", page);
  }, [page]);

  // Handlers to switch pages

  const handleGoToLogin = () => setPage("login");
  const handleGoToSignup = () => setPage("signup");
  const handleGoToHome = () => setPage("home");

  // Handle login success: set user and go to chat
  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
    setPage("chat");
  };

  // Logout handler
  const handleLogout = () => {
    Cookies.remove("token");
    setUser(null);
    setPage("home");
    localStorage.setItem("page", "home");
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
      {page === "chat" && user && <Chat user={user} onLogout={handleLogout} />}
      <ToastContainer position="top-center" autoClose={2000} />
    </>
  );
}

export default App;
