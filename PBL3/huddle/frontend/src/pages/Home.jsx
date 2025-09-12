import React from "react";
import {
  MessageCircle,
  Users,
  Share2,
  Download,
  Menu,
  LogInIcon,
  ChevronRight,
} from "lucide-react";

const Home = ({ onLogin, onSignup, username, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">
                Shambaad
              </span>
              {username && (
                <span className="ml-4 text-blue-600 font-semibold">
                  Welcome, {username}!
                </span>
              )}
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#"
                className="text-slate-700 hover:text-blue-600 font-medium transition-colors"
              >
                Product
              </a>
              <a
                href="#feature"
                className="text-slate-700 hover:text-blue-600 font-medium transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-slate-700 hover:text-blue-600 font-medium transition-colors"
              >
                Pricing
              </a>
              <a
                href="#"
                className="text-slate-700 hover:text-blue-600 font-medium transition-colors"
              >
                Resources
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              {username ? (
                <button
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  onClick={onLogout}
                >
                  Logout
                </button>
              ) : (
                <>
                  <button
                    className="hidden md:block px-4 py-2 text-slate-700 hover:text-blue-600 font-medium transition-colors"
                    onClick={onLogin}
                  >
                    Log In
                  </button>
                  <button
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    onClick={onSignup}
                  >
                    Sign Up
                  </button>
                </>
              )}
              <button className="md:hidden p-2 text-slate-700">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Shambaad: Where Voices
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 block">
                Connect
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Experience a new way to socialize with Shambaad, the audio-first
              social app designed for intimate conversations and genuine
              connections. Share your thoughts, stories, and moments through
              voice.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#feature">
                <button className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 group">
                  <span>Learn more</span>
                  <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </a>
              <button
                className="px-8 py-4 text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-colors border-2 border-blue-600 flex items-center hover:border-blue-700"
                onClick={onLogin}
              >
                <span>Log In</span>
                <LogInIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="feature" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Key Features
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Discover the unique features that make Shambaad stand out from
              traditional social media platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-slate-50 rounded-2xl p-8 hover:bg-blue-50 transition-all duration-300 hover:shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Audio-First Interactions
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Engage in authentic conversations through voice messages and
                live audio rooms, fostering deeper connections.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-slate-50 rounded-2xl p-8 hover:bg-blue-50 transition-all duration-300 hover:shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Intimate Social Circles
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Create and manage intimate social circles, allowing you to share
                voice notes with the people who matter most.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-slate-50 rounded-2xl p-8 hover:bg-blue-50 transition-all duration-300 hover:shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Real-Time Voice Sharing
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Share your thoughts and experiences in real-time through voice,
                capturing the nuances and emotions of your moments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section
        id="pricing"
        className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Join the Shambaad Community Today
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Download the app and start connecting with others through the power
            of voice.
          </p>
          <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto group">
            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Download the App</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Shambaad</span>
            </div>

            <div className="flex space-x-8 mb-4 md:mb-0">
              <a href="#" className="hover:text-white transition-colors">
                About
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>

            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                <Users className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                <Share2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p>&copy; 2024 Shambaad. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
