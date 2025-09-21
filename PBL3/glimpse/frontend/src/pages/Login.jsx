import React, { useContext, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthContext } from "../AuthContext";
import { ThemeContext } from "../ThemeContext";

const Login = () => {
  const { isDark } = useContext(ThemeContext);
  const { setToken, setUser, setIsLoggedIn } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isShown, setIsShown] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/api/login", {
        email,
        password,
      });
      const { token, name } = res.data;
      localStorage.setItem("token", token);
      setToken(token);
      setUser({ username: name });
      setIsLoggedIn(true);
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.error || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-[calc(100vh)] flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md rounded-[40px] shadow-xl bg-slate-800 relative overflow-hidden">
        {/* Gradient Top Border */}
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500" />

        {/* Inner Card */}
        <div className="p-8">
          {/* Logo + Title */}
          <div className="flex flex-col items-center mb-8 ">
            <div className="w-16 h-16 mb-3 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <span className="text-white text-xl font-bold">G</span>
            </div>
            <h1 className="text-3xl font-light text-white mb-1">Glimpse</h1>
            <p className="text-gray-300 text-sm font-light">
              One-second video journals
            </p>
          </div>

          {/* Email Field */}
          <div className="mb-5">
            <label className="block text-gray-200 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-700 placeholder-gray-400 text-white border-0 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200"
            />
          </div>

          {/* Password Field */}
          <div className="mb-5">
            <label className="block text-gray-200 text-sm font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={isShown ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-2xl bg-slate-700 placeholder-gray-400 text-white border-0 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200 font-medium"
              />
              <button
                type="button"
                onClick={() => setIsShown(!isShown)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
              >
                {isShown ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            className="w-full py-3 mb-6 rounded-2xl text-white font-medium transition-all duration-200 
              bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleLogin}
          >
            Login
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-400">
            New to Glimpse?{" "}
            <Link
              to="/signup"
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors duration-200"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;