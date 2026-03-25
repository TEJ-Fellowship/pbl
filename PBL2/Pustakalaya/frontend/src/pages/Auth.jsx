import { useState } from "react";
import SignUp from "./SignUp";
import Login from "./Login";
import { useAuth } from "../context/AuthContext";

const Auth = () => {
  const [mode, setMode] = useState("login");
  const { login } = useAuth();

  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div>
      {mode === "login" ? (
        <Login 
          onAuthSuccess={ login }
          onSwitchToSignUp={() => setMode("signup")}
          onGoogleAuth={ handleGoogleAuth }
        />
      ):(

        <SignUp 
          onAuthSuccess={ login }
          onSwitchToLogin={() => setMode("login")}
          onGoogleAuth={ handleGoogleAuth }
        />
      )}
    </div>
  );
};

export default Auth;
