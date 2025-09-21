import React, { useContext, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from 'lucide-react'
import axios from "axios";

const SignUpPage = () => {
  const [username, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [passwordMatch, setPasswordMatch] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    setPasswordMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  const handleSignUp = async (e) => {
    e.preventDefault()
    if(passwordMatch){
      setError(null)
      setIsLoading(true)
      setIsSuccess(false)
      try {
        console.log("Attempting to sign up with:", { username, email });
        const signupDetails = { username, email, password };
        await axios.post("http://localhost:3001/api/users", signupDetails)
        console.log("Sign up successful!");
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          // In a real app, you would handle successful sign-up here, e.g., redirect
          // window.location.href = "/dashboard";
          navigate("/login");
        }, 3000);
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Sign up failed. Please try again.";
        setError(errorMessage);
        navigate("/signup]]")
      } finally {
        setIsLoading(false);
      }
    }




  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa] p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md mx-auto transform transition-transform duration-300 hover:scale-[1.01]">
        <h2 className="text-3xl font-bold text-center text-[#1f2937] mb-2">
          Create an Account
        </h2>
        <p className="text-center text-[#6b7280] mb-8">
          Join us to start sharing your glimpses.
        </p>

        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Full Name Input */}
          <div>
            <label 
              htmlFor="fullName" 
              className="block text-sm font-medium text-[#1f2937]"
            >
              Full Name
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUserName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 bg-white text-[#1f2937] border border-[#e5e7eb] rounded-md shadow-sm focus:ring-[#5b13ec] focus:border-[#5b13ec] sm:text-sm transition-colors duration-200"
            />
          </div>

          {/* Email Input */}
          <div>
            <label 
              htmlFor="email" 
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

          {/* Confirm Password Input with Toggle */}
          <div className="relative">
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-medium text-[#1f2937]"
            >
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 bg-white text-[#1f2937] border border-[#e5e7eb] rounded-md shadow-sm focus:ring-[#5b13ec] focus:border-[#5b13ec] pr-10 sm:text-sm transition-colors duration-200"
            />
            <div 
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5 cursor-pointer text-[#6b7280] hover:text-[#5b13ec]"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </div>
            {!passwordMatch && confirmPassword && (
              <p className="text-red-500 text-xs mt-1 font-medium">
                Passwords don't match
              </p>
              )}
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
              Sign Up successful!
            </div>
          )}

          {/* Sign Up Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#5b13ec] hover:bg-[#4a10c7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5b13ec] transition-colors duration-200'
              }`}
            >
              {isLoading ? "Signing up..." : "Sign Up"}
            </button>
          </div>
        </form>

        {/* Link to login page */}
        <div className="mt-6 text-center text-sm text-[#6b7280]">
          <p className="mt-4">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-[#5b13ec] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
