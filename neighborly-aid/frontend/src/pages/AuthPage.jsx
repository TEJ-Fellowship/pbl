import { Heart, Users, Handshake, Shield, ArrowRight } from "lucide-react";
import AuthForm from "../components/auth/AuthForm";
import { useState } from "react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const handleIsLogin = (bool) => {
    setIsLogin(bool);
  };

  return (
    <div
      className="h-screen w-screen flex m-0 p-0 overflow-hidden"
      style={{ margin: 0, padding: 0 }}
    >
      {/* Left Side - Community Design (Full Height) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 relative overflow-hidden min-h-screen">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute bottom-40 right-10 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-white rounded-full"></div>
        </div>

        {/* Content - Centered Vertically and Horizontally */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 w-full h-full">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <Heart className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4">Neighborly Aid</h1>
            <p className="text-xl text-emerald-100 mb-8 max-w-md">
              Building stronger communities, one neighbor at a time
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-6 w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center mb-3">
                <Users className="h-6 w-6 mr-3" />
                <h3 className="font-semibold text-lg">Community Support</h3>
              </div>
              <p className="text-emerald-100 text-sm">
                Connect with neighbors who are ready to help and support each
                other in times of need.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center mb-3">
                <Handshake className="h-6 w-6 mr-3" />
                <h3 className="font-semibold text-lg">Mutual Aid</h3>
              </div>
              <p className="text-emerald-100 text-sm">
                Share resources, skills, and kindness to create a more resilient
                and caring neighborhood.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center mb-3">
                <Shield className="h-6 w-6 mr-3" />
                <h3 className="font-semibold text-lg">Safe & Secure</h3>
              </div>
              <p className="text-emerald-100 text-sm">
                Your privacy and safety are our top priorities. Connect with
                verified community members.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center text-emerald-100">
              <span className="text-lg">Join thousands of helpers</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo and Header */}
          <div className="hidden lg:block text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-emerald-600 mb-2">
              Neighborly Aid
            </h1>
            <p className="text-gray-600">
              {isLogin
                ? "Welcome back! Sign in to continue helping."
                : "Join our community of helpers today."}
            </p>
          </div>

          {/* Auth Form */}
          <AuthForm isLogin={isLogin} handleIsLogin={handleIsLogin} />

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Made with ❤️ for community helpers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
