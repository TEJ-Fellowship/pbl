// src/components/Auth/LoginForm.jsx

import { useState } from "react";
import { useContext } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import service from "../../services/service";
import { AuthContext } from "../../context/AuthContext.jsx";
const loginURL = import.meta.env.VITE_LOGIN_URL;

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loginData = { email: email.trim(), password: password.trim() };
    if ((!email.trim(), !password.trim())) {
      setError("All fields are required");
      return;
    }
    try {
      const response = await service.create(loginURL, loginData);
      if (!response.token) {
        console.log("this is error no token");
        return;
      } else {
        localStorage.setItem("token", response.token);
        setIsAuthenticated(true); // Update auth state
        navigate("/dashboard", { state: { user: response } });

        setEmail("");
        setPassword("");
      }
    } catch (error) {
      setError(error);
    }
  };

  return (
    <>
      <div>
        <p>SkillUp AI</p>
        <form onSubmit={handleSubmit}>
          <p>
            Email:{" "}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="type email"
            ></input>
          </p>
          <p>
            Password:{" "}
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="type password"
            ></input>
          </p>
          <button>Sign In</button> {/* onClick={handleLogin} */}
        </form>
        <p>
          Don't have an Account? <Link to="/register"> Sign Up</Link>
        </p>
      </div>
    </>
  );
};

export default LoginForm;
