import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Signup = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLogin(data.user);
        navigate("/");
        alert("Signup successful!");
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Title */}
      <h2 className="text-3xl font-extrabold text-center text-primary mb-2">
        Create Account
      </h2>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
        Join us and start your journey
      </p>

      {/* Form */}
      <form onSubmit={handleSignup} className="space-y-5">
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                       placeholder-gray-400 dark:placeholder-gray-500 
                       focus:ring-2 focus:ring-primary focus:border-primary transition"
            required
          />
        </div>
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
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 pr-10 rounded-xl border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                       placeholder-gray-400 dark:placeholder-gray-500 
                       focus:ring-2 focus:ring-primary focus:border-primary transition"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 
                       text-gray-500 dark:text-gray-400 hover:text-primary transition"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 pr-10 rounded-xl border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                       placeholder-gray-400 dark:placeholder-gray-500 
                       focus:ring-2 focus:ring-primary focus:border-primary transition"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 
                       text-gray-500 dark:text-gray-400 hover:text-primary transition"
          >
            {showConfirm ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Signup Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold 
                     bg-primary text-white hover:bg-primary/90 
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed 
                     shadow-md"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      {/* Redirect */}
      <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <button
          onClick={() => navigate("/login")}
          className="text-secondary font-medium hover:underline"
        >
          Login
        </button>
      </p>
    </div>
  );
};

export default Signup;
