import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const SignUp = () => {
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (formData.password === formData.confirmPassword) {
      axios.post('http://localhost:3001/api/users', {
        userName: formData.userName,
        email: formData.email,
        password: formData.password
      })
      .then(() => console.log("User registered successfully"))
      .catch((error) => console.error(error));
    }
  };

  const passwordsMatch = formData.password === formData.confirmPassword;

  return (
    <div className='min-h-screen flex items-center justify-center px-4'
      style={{
        backgroundImage: 'radial-gradient(circle, #043317, #072b15, #092412, #081c0f, #05150a, #071004, #070a01, #030300, #030200, #030100, #020000, #000000)'
      }}
    >
      <div className="w-full max-w-md bg-black/50 border border-secondary rounded-xl p-12 shadow-2xl backdrop-blur-md">
        <div className="mx-auto flex items-center justify-center mb-6">
          <img src="logo2.png" alt="logo" className="h-20" />
        </div>

        <h2 className="text-center text-xl font-semibold mb-6 text-white">Create Account</h2>

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSignUp}>
          <input
            type="text"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            placeholder="Enter your username"
            className="w-full px-4 py-3 rounded-md bg-transparent border border-secondary text-text-secondary"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your Email"
            className="w-full px-4 py-3 rounded-md bg-transparent border border-secondary text-text-secondary"
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword.password ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Choose a password"
              className="w-full px-4 py-3 pr-16 rounded-md bg-transparent border border-secondary text-text-secondary"
            />
            <img
              src={showPassword.password ? "/openEye.png" : "/closeEye.png"}
              alt="toggle password"
              onClick={() => toggleVisibility("password")}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 cursor-pointer"
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-4 relative">
            <input
              type={showPassword.confirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="w-full px-4 py-3 pr-16 rounded-md bg-transparent border border-secondary text-text-secondary"
            />
            <img
              src={showPassword.confirmPassword ? "/openEye.png" : "/closeEye.png"}
              alt="toggle confirm password"
              onClick={() => toggleVisibility("confirmPassword")}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 cursor-pointer"
            />
          </div>

          {submitted && !passwordsMatch && (
            <span className="text-red-400">Please check your passwords</span>
          )}

          <button
            type="submit"
            className="bg-primary text-text-primary font-semibold py-3 rounded-md hover:bg-accent transition"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already a Member?{" "}
          <span className="text-primary font-semibold hover:underline">
            <Link to="/LogIn">Log In</Link>
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
