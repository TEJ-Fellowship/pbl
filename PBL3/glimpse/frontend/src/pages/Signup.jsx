import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { ThemeContext } from "../ThemeContext";

const Signup = () => {
  const { isDark } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isShown, setIsShown] = useState(false);
  const [isConfirmShown, setIsConfirmShown] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

  useEffect(() => {
    setPasswordMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  const handleSignup = () => {
    if (passwordMatch) {
      const signupDetails = { username, email, password };
      axios
        .post("http://localhost:3001/api/users", signupDetails)
        .then(() => {
          alert("User registered successfully! Check your mail to verify before login");
          navigate("/login");
        })
        .catch((error) => {
          alert(error);
          navigate("/signup");
        });
    }
  };

  return (
    <div className="min-h-[calc(100vh)] flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md rounded-[40px] shadow-lg bg-slate-800 relative overflow-hidden">
        {/* Gradient Top Border */}
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500" />

        {/* Inner Card */}
        <div className="p-5">
          {/* Logo + Title */}
          <div className="flex flex-col items-center mb-5">
            <div className="w-12 h-12 mb-2 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <span className="text-white text-base font-bold">G</span>
            </div>
            <h1 className="text-xl font-semibold text-white mb-1">
              Create Account
            </h1>
            <p className="text-gray-300 text-xs font-medium">
              Join Glimpse today
            </p>
          </div>

          {/* Name Field */}
          <div className="mb-3">
            <label className="block text-gray-200 text-sm font-semibold mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Your Name"
              value={username}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-700 placeholder:text-sm placeholder-gray-400 text-white border-0 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200 font-medium"
            />
          </div>

          {/* Email Field */}
          <div className="mb-3">
            <label className="block text-gray-200 text-sm font-semibold mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-700 placeholder:text-sm placeholder-gray-400 text-white border-0 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200 font-medium"
            />
          </div>

          {/* Password Field */}
          <div className="mb-3">
            <label className="block text-gray-200 text-sm font-semibold mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={isShown ? "text" : "password"}
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-700 placeholder:text-sm placeholder-gray-400 text-white border-0 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200 font-medium"
              />
              <button
                type="button"
                onClick={() => setIsShown(!isShown)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
              >
                {isShown ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="mb-4">
            <label className="block text-gray-200 text-sm font-semibold mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={isConfirmShown ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-700 placeholder:text-sm placeholder-gray-400 text-white border-0 focus:outline-none focus:ring-2 transition-all duration-200 font-medium ${
                  !passwordMatch && confirmPassword
                    ? "focus:ring-red-400 ring-2 ring-red-400"
                    : "focus:ring-violet-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setIsConfirmShown(!isConfirmShown)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
              >
                {isConfirmShown ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {!passwordMatch && confirmPassword && (
              <p className="text-red-400 text-xs mt-1 font-medium">
                Passwords don't match
              </p>
            )}
          </div>

          {/* Sign Up Button */}
          <button
            className="w-full py-2.5 mb-4 rounded-xl text-white font-medium transition-all duration-200 
              bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSignup}
            disabled={
              !passwordMatch || !username || !email || !password || !confirmPassword
            }
          >
            Create Account
          </button>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;