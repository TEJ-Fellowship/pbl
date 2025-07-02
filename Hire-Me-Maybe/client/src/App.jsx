import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AppRoutes from "./AppRoutes";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";

const App = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("loggedUser")) || null
  );
  const [view, setView] = useState("landing");

  const handleSignup = () => {
    toast.success("Signup successful! Please log in.");
    setView("login");
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("loggedUser", JSON.stringify(userData));
    toast.success(`Welcome back, ${userData.username}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedUser");
    setUser(null);
    setView("landing");
    toast.info("You have been logged out.");
  };

  const navigateToLogin = () => {
    setView("login");
  };

  const navigateToSignup = () => {
    setView("signup");
  };

  const navigateToLanding = () => {
    setView("landing");
  };

  // If user is authenticated, show the routed app
  if (user) {
    return (
      <>
        <AppRoutes user={user} onLogout={handleLogout} />
        <ToastContainer position="top-center" autoClose={3000} />
      </>
    );
  }

  // Show landing page
  if (view === "landing") {
    return (
      <>
        <LandingPage
          onLoginClick={navigateToLogin}
          onGetStartedClick={navigateToSignup}
        />
        <ToastContainer position="top-center" autoClose={3000} />
      </>
    );
  }

  // Show login page
  if (view === "login") {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onBackToHome={navigateToLanding}
          onGoToSignup={navigateToSignup}
        />
        <ToastContainer position="top-center" autoClose={3000} />
      </>
    );
  }

  // Show signup page
  if (view === "signup") {
    return (
      <>
        <SignupPage
          onSignup={handleSignup}
          onBackToHome={navigateToLanding}
          onGoToLogin={navigateToLogin}
        />
        <ToastContainer position="top-center" autoClose={3000} />
      </>
    );
  }

  // Default fallback
  return (
    <>
      <LandingPage
        onLoginClick={navigateToLogin}
        onGetStartedClick={navigateToSignup}
      />
      <ToastContainer position="top-center" autoClose={3000} />
    </>
  );
};

export default App;