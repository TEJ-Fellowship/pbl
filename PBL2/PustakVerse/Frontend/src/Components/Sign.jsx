import React, { useState } from "react";
import { FaEye } from 'react-icons/fa6';
import { LuEyeClosed } from 'react-icons/lu';

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return alert("Passwords do not match");

    const res = await fetch("http://localhost:3001/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    alert(data.message || data.error);
  };

  return (
    <form onSubmit={handleSignup} className="space-y-3 p-4 border rounded">
      <h2 className="text-lg font-bold">Sign Up</h2>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full"
      />

      {/* Password */}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
        >
          {showPassword ? (
            <FaEye className="w-5 h-5" />
          ) : (
            <LuEyeClosed className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Confirm Password */}
      <div className="relative">
        <input
          type={showConfirm ? "text" : "password"}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border p-2 w-full pr-10"
        />
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
        >
          {showConfirm ? (
            <FaEye className="w-5 h-5" />
          ) : (
            <LuEyeClosed className="w-5 h-5" />
          )}
        </button>
      </div>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Sign Up
      </button>
    </form>
  );
};

export default Signup;
