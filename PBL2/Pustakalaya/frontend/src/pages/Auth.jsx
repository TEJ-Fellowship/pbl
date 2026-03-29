import { useState } from "react";
import SignUp from "./SignUp";
import Login from "./Login";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { consumePendingBorrow } from "../utils/pendingBorrowStorage";
import { addShelfItem } from "../utils/shelfStorage";

const Auth = () => {
  const [mode, setMode] = useState("login");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // This handles the redirection after a successful login/signup
  function handleLoginSuccess() {
    login();
    const pendingBorrow = consumePendingBorrow();
    if (pendingBorrow) {
      addShelfItem(pendingBorrow);
      navigate("/my-shelf", { replace: true });
      return;
    }

    const from = location.state?.from;
    const isSafePath =
      typeof from === "string" &&
      from.startsWith("/") &&
      !from.startsWith("//") &&
      !from.startsWith("/\\");

    const safeFrom = isSafePath && from !== "/auth" ? from : "/";
    navigate(safeFrom, { replace: true });
  }

  const handleGoogleAuth = () => {
    // Note: If using Google OAuth redirect, handleLoginSuccess
    // will usually happen on a callback route, not here.
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="auth-container">
      <h1>{mode === "login" ? "Login" : "Sign Up"}</h1>

      {mode === "login" ? (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignUp={() => setMode("signup")}
          onGoogleAuth={handleGoogleAuth}
        />
      ) : (
        <SignUp
          onSignUpSuccess={handleLoginSuccess}
          onSwitchToLogin={() => setMode("login")}
          onGoogleAuth={handleGoogleAuth}
        />
      )}
    </div>
  );
};

export default Auth;
