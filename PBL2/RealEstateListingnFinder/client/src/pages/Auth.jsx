import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import login from '../assets/login.jpg'
import GoogleButton from 'react-google-button'

const handleSubmit = (e) => {
  e.preventDefault()
};

  const handleGoogleSignIn = () => {
    console.log("Google sign in clicked");
  };

const Auth = () => {
    const [showPassword, setShowPassword] = useState(false)
  return (
    <div className="flex items-center bg-white min-h-screen">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row rounded-xl shadow-xl overflow">
          {/* Left Part */}
          <div className="w-full lg:w-1/2 p-44">
            <div className="flex flex-col">
              <h3 className="text-3xl text-gray-900 mb-2 font-bold">
                Welcome Back
              </h3>
              <p className="text-gray-600 mb-2">Please enter your details</p>

              {/*Form*/}
              <form onSubmit={handleSubmit}>
                <div className="mb-4 mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition-all duration-200 placeholder:text-sm"
                    placeholder="Enter your email address"
                    type="email"
                  />
                </div>
                <div className="mb-4 mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition-all duration-200 placeholder:text-sm"
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                    >
                      {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      className="w-4 h-4 rounded"
                      type="checkbox"
                      name=""
                      id=""
                    />
                    <span className="ml-2 block text-sm text-gray-700 font-semibold">
                      Remember Me
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
                  >
                    Forget Password
                  </button>
                </div>
                <div className="mt-6 mb-2">
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg font-semibold hover:bg-blue-700 cursor-pointer transition-all duration-200 transform hover:translate-y-[-1px] shadow-lg"
                  >
                    Sign in
                  </button>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white border border-gray-300 text-gray-700 mt-5 py-2 px-4 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285f4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34a853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#fbbc05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#ea4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <p className="text-sm text-center text-gray-600 mt-5">
                  Don't have account?{' '}
                  <button type="button" className="text-blue-600 hover:underline ml-2 cursor-pointer font-semibold transition-colors duration-200">
                    Sign up
                  </button>
                </p>
              </form>
            </div>
          </div>
          {/*Right Part*/}
          <div
            className="relative w-full lg:w-1/2 bg-cover bg-center flex items-center justify-center text-white"
            style={{ backgroundImage: `url(${login})` }}
          >
            <div className="absolute inset-0 bg-black opacity-40">
              <div className="relative text-center">
                <h3 className="text-3xl font-bold">Find Your Dream Home</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
