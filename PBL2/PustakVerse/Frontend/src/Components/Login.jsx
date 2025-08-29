import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLogin(data.user);
        navigate("/");
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Title */}
      <h2 className="text-3xl font-extrabold text-center text-primary mb-2">
        Welcome Back
      </h2>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
        Sign in to enter the pustakverse
      </p>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                       placeholder-gray-400 dark:placeholder-gray-500 
                       focus:ring-2 focus:ring-primary focus:border-primary transition"
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                       placeholder-gray-400 dark:placeholder-gray-500 
                       focus:ring-2 focus:ring-primary focus:border-primary transition"
            required
          />
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold 
                     bg-primary text-white hover:bg-primary/90 
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed 
                     shadow-md"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Signup Redirect */}
      <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
        Don’t have an account?{" "}
        <button
          onClick={() => navigate("/signup")}
          className="text-secondary font-medium hover:underline"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

export default Login;
