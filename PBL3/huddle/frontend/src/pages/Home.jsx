import React from "react";
import {
  MessageCircle,
  Users,
  Share2,
  Download,
  Menu,
  LogIn,
  ChevronRight,
  Mic,
} from "lucide-react";
import logo from "../assets/logo.svg";

const Home = ({
  onLogin,
  onSignup,
  username,
  onLogout,
  onRecord,
  onVoiceNotes,
  onChat,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-teal-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img src={logo} className="w-[75px] h-[75px] text-white" />

              {username && (
                <span className="ml-4 text-teal-700 font-semibold">
                  Welcome, {username}!
                </span>
              )}
            </div>

            <div>
              {username ? (
                <nav className="hidden md:flex items-center space-x-8">
                  <a
                    href="#feature"
                    className="text-slate-700 hover:text-teal-600 font-medium transition-colors"
                  >
                    Features
                  </a>
                  <button
                    className="text-slate-700 hover:text-teal-600 transition-colors font-medium"
                    onClick={onChat}
                  >
                    <span>Chat</span>
                  </button>
                  <a
                    href="#pricing"
                    className="text-slate-700 hover:text-teal-600 font-medium transition-colors"
                  >
                    Pricing
                  </a>
                  <button
                    className="text-slate-700 hover:text-teal-600 transition-colors font-medium"
                    onClick={onRecord}
                  >
                    <span>Record Note</span>
                  </button>
                </nav>
              ) : (
                <nav className="hidden md:flex items-center space-x-8">
                  <a
                    href="#"
                    className="text-slate-700 hover:text-teal-600 font-medium transition-colors"
                  >
                    Product
                  </a>
                  <a
                    href="#feature"
                    className="text-slate-700 hover:text-teal-600 font-medium transition-colors"
                  >
                    Features
                  </a>
                  <a
                    href="#pricing"
                    className="text-slate-700 hover:text-teal-600 font-medium transition-colors"
                  >
                    Pricing
                  </a>
                  <a
                    href="#"
                    className="text-slate-700 hover:text-teal-600 font-medium transition-colors"
                  >
                    Resources
                  </a>
                </nav>
              )}
            </div>
            <div className="flex items-center space-x-2 ">
              {username ? (
                <>
                  <button
                    className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={onVoiceNotes}
                  >
                    My Notes
                  </button>
                  <button
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={onChat}
                  >
                    Chat
                  </button>
                  <button
                    className="px-6 py-2 bg-gradient-to-r from-slate-500 to-slate-600 text-white font-medium rounded-lg hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-sm hover:shadow-md border border-slate-400"
                    onClick={onLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="hidden md:block px-4 py-2 text-slate-700 hover:text-teal-600 font-medium transition-colors"
                    onClick={onLogin}
                  >
                    Log In
                  </button>
                  <button
                    className="px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 shadow-sm hover:shadow-md"
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
              Sambaad: Where Voices
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 block">
                Connect
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Experience a new way to socialize with Sambaad, the audio-first
              social app designed for intimate conversations and genuine
              connections. Share your thoughts, stories, and moments through
              voice.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {username ? (
                <a href="#RecordNote">
                  <button
                    onClick={onRecord}
                    className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-medium rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 group"
                  >
                    <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Record Note</span>
                  </button>
                </a>
              ) : (
                ""
              )}

              <a href="#feature">
                <button className="px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 group">
                  <span>Learn more</span>
                  <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </a>
              {username ? (
                <button
                  className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={onChat}
                >
                  <span>Let's Chat</span>
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform inline-block ml-2" />
                </button>
              ) : (
                <button
                  className="px-8 py-4 text-teal-600 font-semibold hover:bg-teal-50 rounded-xl transition-colors border-2 border-teal-600 flex items-center hover:border-teal-700"
                  onClick={onLogin}
                >
                  <span>Log In</span>
                  <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="feature" className="py-20 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Key Features
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Discover the unique features that make Sambaad stand out from
              traditional social media platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 hover:from-teal-100 hover:to-cyan-100 transition-all duration-300 hover:shadow-xl border border-teal-100">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
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
            <div className="group bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 hover:from-cyan-100 hover:to-blue-100 transition-all duration-300 hover:shadow-xl border border-cyan-100">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
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
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:shadow-xl border border-blue-100">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
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
        className="py-20 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Join the Sambaad Community Today
          </h2>
          <p className="text-xl text-teal-100 mb-10 leading-relaxed">
            Download the app and start connecting with others through the power
            of voice.
          </p>
          <button className="px-8 py-4 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto group">
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img src={logo} className="w-[75px] h-[75px] text-white" />
              </div>
              <span className="text-xl font-bold text-white">Sambaad</span>
            </div>

            <div className="flex space-x-8 mb-4 md:mb-0">
              <a href="#" className="hover:text-teal-300 transition-colors">
                About
              </a>
              <a href="#" className="hover:text-teal-300 transition-colors">
                Contact
              </a>
              <a href="#" className="hover:text-teal-300 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-teal-300 transition-colors">
                Terms of Service
              </a>
            </div>

            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-teal-700 transition-colors cursor-pointer">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-cyan-700 transition-colors cursor-pointer">
                <Users className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
                <Share2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p>&copy; 2024 Sambaad. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
