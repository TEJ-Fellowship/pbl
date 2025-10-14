import React from "react";
import { Link } from "react-router-dom";
import robot_image from "../assets/robot_image.png";
import { Search, MessageCircle, BookOpen, Users, Mail, BarChart3, Zap } from "lucide-react";

const Landingpage = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800">
      {/* Navbar */}
      <header className="flex justify-between items-center px-8 py-5 border-b bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="text-xl font-bold flex items-center gap-2">
          Mailchimp Support
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-yellow-600">Home</Link>
          <Link to="/help-center" className="hover:text-yellow-600">Help Center</Link>
          <Link to="/analytics" className="hover:text-yellow-600">Analytics</Link>
          <Link to="/campaign-builder" className="hover:text-yellow-600">Campaign Builder</Link>
          <Link to="/templates" className="hover:text-yellow-600">Templates</Link>
          <Link to="/automation" className="hover:text-yellow-600">Automation</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="text-gray-700 hover:text-yellow-600 font-medium transition-colors">
            Login
          </button>
          <button className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors">
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[70vh] flex flex-col items-center justify-center text-center text-white overflow-hidden">
        <img
          src={robot_image}
          alt="Support Robot"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/70"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Welcome to Mailchimp Support
          </h1>
          <p className="text-gray-200 mb-6 max-w-lg mx-auto">
            Get instant answers and personalized help with your email marketing and automation needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/chat" 
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold px-8 py-4 rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <MessageCircle size={20} />
              Start a Chat
            </Link>
            <Link 
              to="/search" 
              className="text-white bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl hover:bg-white hover:text-black transition-all duration-200 flex items-center gap-2 border border-white/30 hover:border-transparent"
            >
              <Search size={20} />
              Search for Help
            </Link>
            <Link 
              to="/campaign-builder" 
              className="text-white bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl hover:bg-white hover:text-black transition-all duration-200 flex items-center gap-2 border border-white/30 hover:border-transparent"
            >
              <Mail size={20} />
              Build Campaign
            </Link>
            <Link 
              to="/analytics" 
              className="text-white bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl hover:bg-white hover:text-black transition-all duration-200 flex items-center gap-2 border border-white/30 hover:border-transparent"
            >
              <BarChart3 size={20} />
              View Analytics
            </Link>
            <Link 
              to="/automation" 
              className="text-white bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl hover:bg-white hover:text-black transition-all duration-200 flex items-center gap-2 border border-white/30 hover:border-transparent"
            >
              <Zap size={20} />
              Automation
            </Link>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-16 bg-gray-50 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">How can we help you?</h2>
        <p className="text-gray-600 mb-10">
          Explore our resources to find solutions to your questions quickly and efficiently.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center bg-yellow-100 text-yellow-600 w-12 h-12 rounded-md mx-auto mb-4">
              <MessageCircle size={24} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Instant Answers</h3>
            <p className="text-gray-600 text-sm">
              Get immediate assistance with common questions and issues through our AI-powered chat.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center bg-yellow-100 text-yellow-600 w-12 h-12 rounded-md mx-auto mb-4">
              <BookOpen size={24} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Comprehensive Knowledge Base</h3>
            <p className="text-gray-600 text-sm">
              Explore our library of articles, tutorials, and guides covering all aspects of Mailchimp.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center bg-yellow-100 text-yellow-600 w-12 h-12 rounded-md mx-auto mb-4">
              <Users size={24} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Connect with Experts</h3>
            <p className="text-gray-600 text-sm">
              For personalized support, connect with our experienced Mailchimp specialists.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-6 text-center text-sm text-gray-500">
        <div className="flex justify-center gap-4 mb-2">
          <a href="#" className="hover:text-yellow-600">Terms of Service</a>
          <a href="#" className="hover:text-yellow-600">Privacy Policy</a>
          <a href="#" className="hover:text-yellow-600">Cookie Preferences</a>
        </div>
        <p>© 2024 Mailchimp. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landingpage;
