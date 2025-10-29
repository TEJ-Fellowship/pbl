import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, LogIn, UserPlus, Settings, ChevronDown, ThumbsUp, ThumbsDown } from "lucide-react";

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "👋 Hello! I'm your Discord Community Support Agent. How can I help you today?",
      timestamp: new Date(),
      sources: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [expandedSources, setExpandedSources] = useState({});
  const [submittedFeedback, setSubmittedFeedback] = useState({}); // messageId -> 'positive' | 'negative'
  const [serverContext, setServerContext] = useState({
    type: 'general',
    size: 'unknown',
    purpose: 'community'
  });
  
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      sources: []
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: inputMessage, 
          sessionId: user?.id || 'anonymous',
          serverContext: serverContext,
          searchOptions: {
            method: 'hybrid',
            enableReranking: true,
            limit: 10
          }
        }),
      });
      
      const data = await response.json();
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.success ? data.answer : "Sorry, I couldn't find relevant information for your query.",
        timestamp: new Date(),
        sources: data.results || [],
        searchMethod: data.searchMethod,
        features: data.features,
        query: inputMessage // keep original question for feedback payload
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "Sorry, there was an error processing your request. Please try again.",
        timestamp: new Date(),
        sources: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
        setUser(data.user);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setServerContext(data.user.serverContext);
        
        // Add welcome message
        const welcomeMessage = {
          id: Date.now(),
          type: 'bot',
          content: `🎉 Welcome ${authMode === 'login' ? 'back' : ''}, ${data.user.username}! I've updated your server context to ${data.user.serverContext.type} server. How can I help you today?`,
          timestamp: new Date(),
          sources: []
        };
        setMessages(prev => [...prev, welcomeMessage]);
      } else {
        console.error('Auth failed:', data.message);
        // You could show an error message to the user here
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setServerContext({
      type: 'general',
      size: 'unknown',
      purpose: 'community'
    });
  };

  const formatMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 py-0.5 rounded text-blue-300">$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-300">$1</blockquote>')
      .replace(/^• (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/\n/g, '<br>');
  };

  const toggleSourceExpansion = (messageId, sourceIndex) => {
    const key = `${messageId}-${sourceIndex}`;
    setExpandedSources(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const sendFeedback = async (message, type) => {
    if (submittedFeedback[message.id]) return;
    // Optimistic UI update for immediate highlight
    setSubmittedFeedback(prev => ({ ...prev, [message.id]: type }));
    try {
      await fetch('http://localhost:3001/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: user?.id || 'anonymous',
          query: message.query || '',
          responseId: String(message.id),
          feedbackType: type
        })
      });
    } catch (e) {
      console.error('Feedback error:', e);
      // Rollback highlight on error
      setSubmittedFeedback(prev => {
        const copy = { ...prev };
        delete copy[message.id];
        return copy;
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Discord Support Agent</h1>
            <p className="text-sm text-gray-400">
              {isAuthenticated ? `${user.username} • ${serverContext.type} server` : 'Anonymous User'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt={user.username}
                className="w-8 h-8 rounded-full"
              />
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                <LogIn size={16} />
                Login
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-gray-600 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                <UserPlus size={16} />
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                {message.type === 'user' ? (
                  <User size={16} className="text-white" />
                ) : (
                  <Bot size={16} className="text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  <div 
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                  />
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 w-full max-w-2xl">
                    <div className="text-xs text-gray-500 mb-2">
                      Sources ({message.sources.length}) • {message.searchMethod} • 
                      {message.features?.reranking && ' Re-ranked'}
                    </div>
                    <div className="space-y-2">
                      {message.sources.slice(0, 3).map((source, index) => (
                        <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                          <div 
                            className="p-3 cursor-pointer hover:bg-gray-700/50 transition-colors"
                            onClick={() => toggleSourceExpansion(message.id, index)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ChevronDown 
                                  size={14} 
                                  className={`text-gray-400 transition-transform ${
                                    expandedSources[`${message.id}-${index}`] ? 'rotate-180' : ''
                                  }`} 
                                />
                                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                  {source.source}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {(source.combinedScore * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {expandedSources[`${message.id}-${index}`] && (
                            <div className="px-3 pb-3 border-t border-gray-700">
                              <div className="mt-2 text-xs text-gray-400">
                                {source.content.substring(0, 200)}...
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback controls for bot messages */}
                {message.type === 'bot' && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>Was this helpful?</span>
                    <button
                      onClick={() => sendFeedback(message, 'positive')}
                      disabled={!!submittedFeedback[message.id]}
                      className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${submittedFeedback[message.id] === 'positive' ? 'border-green-500 text-green-400 font-semibold' : 'border-gray-600 hover:bg-gray-700'}`}
                      title="Thumbs up"
                    >
                      <ThumbsUp size={14} />
                      <span>Yes</span>
                    </button>
                    <button
                      onClick={() => sendFeedback(message, 'negative')}
                      disabled={!!submittedFeedback[message.id]}
                      className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${submittedFeedback[message.id] === 'negative' ? 'border-red-500 text-red-400 font-semibold' : 'border-gray-600 hover:bg-gray-700'}`}
                      title="Thumbs down"
                    >
                      <ThumbsDown size={14} />
                      <span>No</span>
                    </button>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-3xl">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-gray-800 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about Discord..."
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="1"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default ChatInterface;
