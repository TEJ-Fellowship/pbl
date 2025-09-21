import { useState, useContext } from "react";
import { Eye, EyeOff } from 'lucide-react';
import { AuthContext } from "../AuthContext"
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { setToken, setUser, setIsLoggedIn } = useContext(AuthContext)

  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setIsSuccess(false);

    if (!email || !password) {
      setError("Please enter your email and password.");
      setIsLoading(false);
      return;
    }
    try {
      const res = await axios.post("http://localhost:3001/api/login", {
        email,
        password,
      });
      console.log("Login successful!");
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        const { token, name } = res.data;
        localStorage.setItem("token", token);
        setToken(token);
        setUser({ username: name });
        setIsLoggedIn(true);
        navigate("/");
      }, 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials and try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa] p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md mx-auto transform transition-transform duration-300 hover:scale-[1.01]">
        <h2 className="text-3xl font-bold text-center text-[#1f2937] mb-2">
          Log in to your account
        </h2>
        <p className="text-center text-[#6b7280] mb-8">
          Welcome back! Please enter your details.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label 
              // htmlFor="email" 
              className="block text-sm font-medium text-[#1f2937]"
            >
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 bg-white text-[#1f2937] border border-[#e5e7eb] rounded-md shadow-sm focus:ring-[#5b13ec] focus:border-[#5b13ec] sm:text-sm transition-colors duration-200"
            />
          </div>

          {/* Password Input with Toggle */}
          <div className="relative">
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-[#1f2937]"
            >
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 bg-white text-[#1f2937] border border-[#e5e7eb] rounded-md shadow-sm focus:ring-[#5b13ec] focus:border-[#5b13ec] pr-10 sm:text-sm transition-colors duration-200"
            />
            <div 
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5 cursor-pointer text-[#6b7280] hover:text-[#5b13ec]"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              {error}
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg transition-opacity duration-500 ease-in-out">
              Login successful!
            </div>
          )}

          {/* Login Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#5b13ec] hover:bg-[#4a10c7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5b13ec] transition-colors duration-200'
              }`}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </button>
          </div>
        </form>

        {/* Link to sign up page */}
        <div className="mt-6 text-center text-sm text-[#6b7280]">
          <p className="mt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-[#5b13ec] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
