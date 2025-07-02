import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Welcome back, {user.username}!
          </h1>
          <p className="text-gray-600 mb-6">Ready to build your perfect resume?</p>
          <button
            onClick={handleLogout}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Logout
          </button>
        </div>
        <ToastContainer position="top-center" autoClose={3000} />
      </div>
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

  // Fallback - should not reach here
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
