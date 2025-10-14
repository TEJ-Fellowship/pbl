import { SiDiscord } from "react-icons/si";
import { LogIn, UserPlus } from "lucide-react";
import { useState } from "react";

const Navbar = ({ onLogin }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleAuth = async (authData) => {
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        onLogin(data.user);
        setShowAuthModal(false);
      } else {
        console.error('Auth failed:', data.message);
        // You could show an error message to the user here
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60 bg-gray-900/80 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-3 md:px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 -ml-1 md:-ml-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
              <SiDiscord size={16} />
            </span>
            <span className="text-sm md:text-base font-semibold tracking-tight">Support Hub</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#help" className="hover:text-white">Help</a>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
              className="hidden md:inline-flex h-9 items-center gap-2 rounded-md border border-gray-700 px-3 text-sm text-gray-300 hover:bg-gray-800"
            >
              <LogIn size={14} />
              Log In
            </button>
            <button 
              onClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-500"
            >
              <UserPlus size={14} />
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const authData = {
                username: formData.get('username'),
                email: formData.get('email'),
                serverType: formData.get('serverType'),
                serverSize: formData.get('serverSize'),
                purpose: formData.get('purpose')
              };
              handleAuth(authData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Server Type</label>
                  <select
                    name="serverType"
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gaming">Gaming</option>
                    <option value="study">Study</option>
                    <option value="community">Community</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Server Size</label>
                  <select
                    name="serverSize"
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="small">Small (1-50 members)</option>
                    <option value="medium">Medium (51-500 members)</option>
                    <option value="large">Large (500+ members)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Purpose</label>
                  <input
                    type="text"
                    name="purpose"
                    placeholder="e.g., gaming community, study group"
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors"
                >
                  {authMode === 'login' ? 'Login' : 'Sign Up'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 border border-gray-600 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
  
  export default Navbar;
  