import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Menu,
  X,
  HelpCircle,
  MessageSquare,
  Settings,
  Clock,
  Shield,
  TrendingUp,
  Sparkles,
  ChevronDown,
  AlertCircle,
  ExternalLink,
  Zap,
  Award,
  Star,
} from "lucide-react";
import axios from "axios";

export default function PayPalAgentChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Welcome! I'm your PayPal AI Assistant. I'm here to help you resolve any issues quickly and securely. What can I help you with today?",
      timestamp: new Date(),
      suggestions: [
        "Transaction Issues",
        "Account Security",
        "Payment Problems",
        "Refund Status",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const res = await axios.post("http://localhost:5000/api/query", {
        question: currentInput,
        sessionId,
      });

      // Debug the response
      console.log("Backend response:", res.data);

      const botMessage = {
        id: messages.length + 2,
        type: "bot",
        text:
          res.data.answer ||
          res.data.response ||
          "No response received from server",
        timestamp: new Date(),
        sentiment: res.data.sentiment?.sentiment,
        citations: res.data.citations,
        confidence: res.data.confidence,
        disclaimer: res.data.disclaimer,
      };

      console.log("Bot message created:", botMessage);

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = {
        id: messages.length + 2,
        type: "bot",
        text: "⚠️ Sorry, something went wrong. Please try again or contact support.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestion = (suggestion) => {
    setInput(suggestion);
  };

  const stats = [
    {
      icon: Zap,
      label: "Response Time",
      value: "< 30s",
      color: "from-yellow-500 to-orange-500",
      glow: "yellow",
    },
    {
      icon: Shield,
      label: "Security",
      value: "Bank-level",
      color: "from-blue-500 to-indigo-600",
      glow: "blue",
    },
    {
      icon: Award,
      label: "Success Rate",
      value: "98.5%",
      color: "from-emerald-500 to-green-600",
      glow: "emerald",
    },
  ];

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return "text-gray-400";
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "text-emerald-400";
      case "negative":
        return "text-red-400";
      case "neutral":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getSentimentBg = (sentiment) => {
    if (!sentiment) return "from-slate-800/90 to-slate-900/90";
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "from-emerald-900/20 to-slate-900/90";
      case "negative":
        return "from-red-900/20 to-slate-900/90";
      case "neutral":
        return "from-amber-900/20 to-slate-900/90";
      default:
        return "from-slate-800/90 to-slate-900/90";
    }
  };

  const formatText = (text) => {
    if (!text || typeof text !== "string") {
      console.warn("Empty or invalid text:", text);
      return "No content available";
    }

    try {
      return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold text
        .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic text
        .replace(/\n\n/g, "<br><br>") // Double line breaks
        .replace(/\n/g, "<br>"); // Single line breaks
    } catch (error) {
      console.error("Error formatting text:", error);
      return text; // Return original text if formatting fails
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white overflow-hidden relative">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Overlay for sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0 shadow-2xl`}
      >
        <div className="flex flex-col h-full">
          {/* Close button - Mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo Section */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50 rotate-3 hover:rotate-0 transition-transform duration-300">
                  <span className="text-2xl font-black">P</span>
                </div>
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-1 shadow-lg animate-pulse">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  PayPal Agent
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Powered by AI Excellence
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="p-6 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Performance
            </h3>
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="relative flex items-center gap-3">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Menu
            </h3>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-400/30 hover:border-blue-300/50 transition-all group shadow-lg shadow-blue-500/10">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="font-semibold">Active Chat</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-slate-800/50 transition-all group border border-transparent hover:border-slate-700/50">
              <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-white group-hover:scale-110 transition-all">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-slate-400 group-hover:text-white transition-colors font-medium">
                Help Center
              </span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-slate-800/50 transition-all group border border-transparent hover:border-slate-700/50">
              <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-white group-hover:scale-110 transition-all">
                <Settings className="w-5 h-5" />
              </div>
              <span className="text-slate-400 group-hover:text-white transition-colors font-medium">
                Settings
              </span>
            </button>
          </nav>

          {/* User Profile */}
          <div className="p-6 border-t border-slate-700/50">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 hover:border-slate-600/50 transition-all cursor-pointer group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-xl shadow-purple-500/30">
                  <User className="w-6 h-6" />
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">John Doe</p>
                <p className="text-xs text-slate-400 truncate">
                  john@example.com
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu - Mobile only */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 transition-all active:scale-95"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 animate-pulse-slow">
                    <Bot className="w-8 h-8" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-emerald-500 px-2 py-0.5 rounded-full shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    <span className="text-xs font-bold">AI</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    PayPal AI Assistant
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <p className="text-xs text-emerald-400 font-bold">
                      Always Available • 24/7 Support
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600/50 transition-all hover:scale-105 active:scale-95 shadow-lg">
              <X className="w-4 h-4" />
              End Chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 space-y-6">
          {messages.map((message, idx) => (
            <div
              key={message.id}
              className="animate-slideUp"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div
                className={`flex gap-3 sm:gap-4 ${
                  message.type === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl ${
                    message.type === "user"
                      ? "bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-purple-500/40"
                      : "bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 shadow-blue-500/40"
                  } animate-scaleIn`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {message.type === "user" ? (
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
                  )}
                </div>
                <div
                  className={`flex flex-col max-w-xl sm:max-w-2xl ${
                    message.type === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-4 sm:px-5 py-3 sm:py-4 rounded-2xl backdrop-blur-sm border shadow-2xl ${
                      message.type === "user"
                        ? "bg-gradient-to-br from-blue-600/90 to-cyan-600/90 border-blue-400/30 shadow-blue-500/20 rounded-tr-md"
                        : message.isError
                        ? "bg-gradient-to-br from-red-900/50 to-slate-900/90 border-red-500/30 shadow-red-900/50 rounded-tl-md"
                        : `bg-gradient-to-br ${getSentimentBg(
                            message.sentiment
                          )} border-slate-700/50 shadow-slate-900/50 rounded-tl-md`
                    }`}
                  >
                    {message.text && message.text.trim() ? (
                      <div
                        className="text-sm sm:text-base leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: formatText(message.text),
                        }}
                      />
                    ) : (
                      <div className="text-sm text-red-400 italic">
                        ⚠️ No content received from server
                      </div>
                    )}

                    {/* Confidence Score */}
                    {message.confidence && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <Award className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold text-slate-300">
                            Confidence Level
                          </span>
                          <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-full transition-all duration-700 shadow-lg shadow-emerald-500/50"
                              style={{ width: `${message.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-black text-emerald-400">
                            {message.confidence.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Citations */}
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                        <p className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <ExternalLink className="w-3 h-3" />
                          Verified Sources
                        </p>
                        <div className="space-y-1">
                          {message.citations.map((citation, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs text-blue-400 p-2 rounded-lg bg-slate-800/50"
                            >
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                              <span className="truncate flex-1 font-mono">
                                {typeof citation === "string"
                                  ? citation
                                  : citation.source ||
                                    citation.label ||
                                    `Source ${i + 1}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sentiment Badge */}
                    {message.sentiment && (
                      <div className="mt-3 flex items-center gap-2">
                        <div
                          className={`text-xs px-3 py-1.5 rounded-full bg-slate-800/50 ${getSentimentColor(
                            message.sentiment
                          )} font-bold border border-current/20`}
                        >
                          {message.sentiment.toUpperCase()}
                        </div>
                      </div>
                    )}

                    {/* Disclaimer */}
                    {message.disclaimer && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-200 leading-relaxed font-medium">
                          {message.disclaimer}
                        </p>
                      </div>
                    )}
                  </div>

                  {message.suggestions && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestion(suggestion)}
                          className="px-3 sm:px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-slate-700/50 hover:border-blue-500/50 hover:from-blue-600/20 hover:to-cyan-600/20 transition-all hover:scale-105 active:scale-95 shadow-lg"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-xs text-slate-500 mt-2 font-medium">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4 animate-slideUp">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                <Bot className="w-7 h-7" />
              </div>
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm px-6 py-4 rounded-2xl rounded-tl-md border border-slate-700/50 shadow-2xl">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce shadow-lg shadow-blue-400/50"></div>
                  <div
                    className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce shadow-lg shadow-cyan-400/50"
                    style={{ animationDelay: "0.15s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-purple-400 rounded-full animate-bounce shadow-lg shadow-purple-400/50"
                    style={{ animationDelay: "0.3s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50 px-4 sm:px-6 py-4 sm:py-5 shadow-2xl">
          <div className="flex gap-3 items-end max-w-5xl mx-auto">
            <div className="flex-1 relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSend())
                }
                placeholder="Type your message here..."
                rows="1"
                className="w-full bg-gradient-to-r from-slate-800/90 to-slate-900/90 border border-slate-700/50 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 pr-12 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-500 shadow-xl group-hover:border-slate-600/50 text-sm sm:text-base"
              />
              <div className="absolute bottom-2 sm:bottom-3 right-2 text-xs text-slate-500">
                <kbd className="hidden sm:inline px-2 py-1 bg-slate-800/50 rounded border border-slate-700/50 font-mono">
                  ↵
                </kbd>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="relative bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-700 hover:via-cyan-600 hover:to-blue-700 disabled:from-slate-800 disabled:to-slate-900 disabled:cursor-not-allowed rounded-2xl p-3 sm:px-6 sm:py-4 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 disabled:shadow-none group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              <Send className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500 max-w-5xl mx-auto">
            <span className="font-mono">Session: {sessionId.slice(0, 8)}</span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              End-to-end encrypted
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
