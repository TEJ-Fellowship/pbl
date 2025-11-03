import { SiDiscord } from "react-icons/si";
import { LogIn, UserPlus } from "lucide-react";
import { useState } from "react";

const Navbar = ({ onLogin, onOpenChat, onOpenHistory }) => {
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
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-black/60 border-b border-blue-500/10 px-8 md:px-16 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl animate-pulse shadow-lg shadow-blue-500/50">
              🤖
            </div>
            <span className="text-xl font-bold text-white">Support Hub</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-500 after:to-pink-500 hover:after:w-full after:transition-all">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-500 after:to-pink-500 hover:after:w-full after:transition-all">Pricing</a>
            <a href="#help" className="text-gray-300 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-500 after:to-pink-500 hover:after:w-full after:transition-all">Help</a>
          </div>
          <div className="flex items-center gap-4">
            {/* Open Chat (full page) - uses Sign Up animation style */}
            <button
              onClick={() => onOpenChat && onOpenChat()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all"
              title="Chat"
            >
              💬
              <span className="hidden sm:inline">Chat</span>
            </button>
            <button
              onClick={() => onOpenHistory && onOpenHistory()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
              title="History"
            >
              🕘
              <span className="hidden sm:inline">History</span>
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
  