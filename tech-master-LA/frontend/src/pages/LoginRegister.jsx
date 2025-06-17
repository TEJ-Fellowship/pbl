import React, { useState } from "react";
import { Sparkles, Code, BrainCircuit } from "lucide-react";
import LoginRegisterForm from "../components/auth/LoginRegisterForm";

const LoginRegister = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-1 h-32 bg-red-500 opacity-60"></div>
        <div className="absolute top-40 right-32 w-1 h-24 bg-red-500 opacity-40"></div>
        <div className="absolute bottom-32 left-1/4 w-px h-20 bg-white opacity-20"></div>
        <div className="absolute bottom-20 right-20 w-px h-16 bg-white opacity-30"></div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <BrainCircuit className="w-8 h-8 text-black" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <Code className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-light text-white mb-2">TechMaster</h1>
            <p className="text-gray-400 text-sm font-light">
              Your AI-powered study companion
            </p>
          </div>

          {/* Auth Card */}
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Tab Switcher */}
            <div className="flex mb-8 bg-white/5 rounded-2xl p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  isLogin
                    ? "bg-white text-black shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  !isLogin
                    ? "bg-white text-black shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>
            <LoginRegisterForm isLogin={isLogin} />
          </div>

          {/* Features Preview */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="group">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-2 group-hover:bg-white/10 transition-colors duration-300">
                <BrainCircuit className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-xs text-gray-400">AI Chat</p>
            </div>
            <div className="group">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-2 group-hover:bg-white/10 transition-colors duration-300">
                <Sparkles className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-xs text-gray-400">Smart Quizzes</p>
            </div>
            <div className="group">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-2 group-hover:bg-white/10 transition-colors duration-300">
                <Code className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-xs text-gray-400">Track Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle animations */}
      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .floating {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginRegister;
