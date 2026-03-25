import { useState } from "react";
import SignUp from "./SignUp";
import Login from "./Login";

const Auth = () => {
  const [mode, setMode] = useState("login");

  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div>
      {mode === "login" ? (
        <Login 
          onSwitchToSignUp={() => setMode("signup")}
          onGoogleAuth={ handleGoogleAuth }
        />
      ):(

        <SignUp 
          onSwitchToLogin={() => setMode("login")}
          onGoogleAuth={ handleGoogleAuth }
        />
      )}
    </div>
  );
};

export default Auth;
