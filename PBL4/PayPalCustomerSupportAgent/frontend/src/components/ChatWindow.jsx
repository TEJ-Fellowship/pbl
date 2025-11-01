import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Zap,
  Shield,
  MessageSquare,
  Star,
} from "lucide-react";

export default function PayPalChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hey there! 👋 I'm your PayPal AI Assistant. Ready to help you with anything - from transactions to account security. What's on your mind?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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
      sender: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("http://localhost:5000/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentInput,
          sessionId,
        }),
      });

      const data = await res.json();

      const botMessage = {
        id: messages.length + 2,
        sender: "bot",
        text:
          data.answer ||
          data.response ||
          "I'm having trouble responding right now. Please try again.",
        timestamp: new Date(),
        sentiment: data.sentiment?.sentiment,
        citations: data.citations,
        confidence: data.confidence,
        disclaimer: data.disclaimer,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = {
        id: messages.length + 2,
        sender: "bot",
        text: "⚠️ Oops! Something went wrong. Let's try that again!",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  // Map source names to PayPal URLs
  const getSourceUrl = (sourceName) => {
    if (!sourceName) return null;

    const sourceLower = sourceName.toLowerCase();

    // Map source names to PayPal URLs
    const sourceUrlMap = {
      // Fee-related sources
      "paypal_consumer_fees.json":
        "https://www.paypal.com/us/webapps/mpp/paypal-fees",
      "paypal_merchant_fees.json":
        "https://www.paypal.com/us/webapps/mpp/paypal-fees",
      "paypal_braintree_fees.json":
        "https://www.paypal.com/us/webapps/mpp/paypal-fees",

      // Policy and agreement sources
      user_agreement:
        "https://www.paypal.com/us/webapps/mpp/ua/useragreement-full",
      "user agreement":
        "https://www.paypal.com/us/webapps/mpp/ua/useragreement-full",
      policy: "https://www.paypal.com/us/webapps/mpp/ua/useragreement-full",
      policies: "https://www.paypal.com/us/webapps/mpp/ua/useragreement-full",

      // Protection programs
      seller_protection:
        "https://www.paypal.com/us/webapps/mpp/security/seller-protection",
      "seller protection":
        "https://www.paypal.com/us/webapps/mpp/security/seller-protection",
      buyer_protection:
        "https://www.paypal.com/us/webapps/mpp/paypal-safety-and-security",
      "buyer protection":
        "https://www.paypal.com/us/webapps/mpp/paypal-safety-and-security",
      "purchase protection":
        "https://www.paypal.com/us/webapps/mpp/paypal-safety-and-security",

      // Disputes
      dispute: "https://www.paypal.com/disputes/",
      disputes: "https://www.paypal.com/disputes/",
      "dispute resolution": "https://www.paypal.com/disputes/",

      // Developer documentation
      developer_docs: "https://developer.paypal.com/docs/",
      developer: "https://developer.paypal.com/docs/",
      api: "https://developer.paypal.com/docs/",
      docs: "https://developer.paypal.com/docs/",
    };

    // Direct match
    if (sourceUrlMap[sourceLower]) {
      return sourceUrlMap[sourceLower];
    }

    // Partial match - check if source name contains any key
    for (const [key, url] of Object.entries(sourceUrlMap)) {
      if (sourceLower.includes(key)) {
        return url;
      }
    }

    // Default to Help Center if no match found
    return "https://www.paypal.com/us/cshelp/";
  };

  const formatText = (text) => {
    if (!text || typeof text !== "string") return "No content available";

    let formatted = text;

    // First, handle 🔗 emoji links (do this before regular URL processing)
    formatted = formatted.replace(
      /🔗\s*(https?:\/\/[^\s<>"{}|\\^`[\]()]+|[a-zA-Z0-9][^\s<>"{}|\\^`[\]()]*\.[a-zA-Z]{2,}[^\s<>"{}|\\^`[\]()]*)/gi,
      (match, url) => {
        let href = url.trim();
        if (!href.startsWith("http://") && !href.startsWith("https://")) {
          href = "https://" + href;
        }
        return `🔗 <a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors break-all">${url.trim()}</a>`;
      }
    );

    // Then convert plain URLs to clickable links
    // Match URLs: https://..., http://..., www...., or domain.com/path
    const urlRegex =
      /(https?:\/\/[^\s<>"{}|\\^`[\]()]+|www\.[^\s<>"{}|\\^`[\]()]+|[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(:\d+)?(\/[^\s<>"{}|\\^`[\]()]*)?)/gi;

    // Process URLs by finding matches and their positions
    const matches = [];
    let match;
    urlRegex.lastIndex = 0; // Reset regex state
    while ((match = urlRegex.exec(formatted)) !== null) {
      matches.push({
        url: match[0],
        index: match.index,
      });
    }

    // Process matches in reverse order to preserve indices
    for (let i = matches.length - 1; i >= 0; i--) {
      const { url, index } = matches[i];

      // Skip if already inside HTML tags
      const before = formatted.substring(Math.max(0, index - 100), index);
      if (before.includes("<a ") || before.includes("href=")) {
        continue;
      }

      // Skip if it's part of markdown link syntax [text](url)
      if (before.includes("](")) {
        continue;
      }

      // Clean up URL (remove trailing punctuation that shouldn't be part of link)
      let cleanUrl = url.replace(/[.,;:!?]+$/, "");
      const trailingPunct = url.slice(cleanUrl.length);

      // Add protocol if missing
      let href = cleanUrl;
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        href = "https://" + cleanUrl;
      }

      // Replace the URL with clickable link
      const replacement = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors break-all">${cleanUrl}</a>${trailingPunct}`;
      formatted =
        formatted.substring(0, index) +
        replacement +
        formatted.substring(index + url.length);
    }

    // Then apply other formatting
    return formatted
      .replace(
        /\*\*(.*?)\*\*/g,
        "<strong class='text-white font-semibold'>$1</strong>"
      )
      .replace(/\*(.*?)\*/g, "<em class='text-gray-200'>$1</em>")
      .replace(
        /`(.*?)`/g,
        "<code class='bg-slate-900/80 px-2 py-0.5 rounded text-cyan-300 font-mono border border-cyan-500/30'>$1</code>"
      )
      .replace(/\n\n/g, "<br><br>")
      .replace(/\n/g, "<br>");
  };

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "😊";
      case "negative":
        return "😟";
      case "neutral":
        return "😐";
      default:
        return "💭";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 p-4 md:p-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/30 rounded-full blur-3xl animate-float-slow"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Logo Area */}
        <div className="mb-6 text-center animate-fadeInDown">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50 animate-pulse-glow">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-purple-950 animate-ping"></div>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                PayPal AI
              </h1>
              <p className="text-xs text-purple-300 font-semibold">
                Your Smart Assistant
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.5),0_0_80px_rgba(139,92,246,0.3)] overflow-hidden animate-scaleIn">
          {/* Chat Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border-b border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 animate-wiggle">
                    <Bot className="w-8 h-8" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-green-500 px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-[10px] font-black">LIVE</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    AI Assistant
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-spin-slow" />
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/30">
                      <Zap className="w-3 h-3 text-green-400" />
                      <span className="text-[10px] text-green-300 font-bold">
                        Fast
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30">
                      <Shield className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] text-blue-300 font-bold">
                        Secure
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs text-purple-300 font-mono">
                  {messages.length} messages
                </div>
                <div className="text-[10px] text-gray-400">
                  Session: {sessionId.slice(0, 6)}
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                } animate-messageSlide`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform hover:scale-110 ${
                    msg.sender === "user"
                      ? "bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 shadow-pink-500/50 animate-wiggle"
                      : "bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 shadow-cyan-500/50 animate-wiggle"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-6 h-6" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`flex flex-col max-w-xl ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`group px-5 py-4 rounded-3xl shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                      msg.sender === "user"
                        ? "bg-gradient-to-br from-pink-600/90 via-rose-600/90 to-orange-600/90 border border-pink-400/30 rounded-tr-md shadow-pink-500/20 hover:shadow-pink-500/40"
                        : msg.isError
                        ? "bg-gradient-to-br from-red-600/40 to-red-900/60 border border-red-500/40 rounded-tl-md shadow-red-900/50"
                        : "bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 border border-slate-600/50 rounded-tl-md shadow-slate-900/50 hover:border-purple-500/30 hover:shadow-purple-500/20"
                    }`}
                  >
                    {/* Message text with typing effect placeholder */}
                    <div
                      className="text-base leading-relaxed text-white"
                      dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                    />

                    {/* Sentiment & Confidence Row */}
                    {msg.sentiment && msg.confidence && (
                      <div className="mt-4 flex items-center gap-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-600/50">
                          <span className="text-lg">
                            {getSentimentEmoji(msg.sentiment)}
                          </span>
                          <span className="text-xs font-bold text-purple-300 uppercase">
                            {msg.sentiment}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-900/50 rounded-full overflow-hidden border border-slate-600/30">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                              style={{ width: `${msg.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-black text-white">
                            {msg.confidence}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                        <p className="text-xs font-bold text-purple-300 flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Sources
                        </p>
                        <div className="space-y-1.5">
                          {msg.citations.map((citation, i) => {
                            const sourceName =
                              typeof citation === "string"
                                ? citation
                                : citation.source ||
                                  citation.label ||
                                  `Source ${i + 1}`;

                            const sourceUrl = getSourceUrl(sourceName);

                            return (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-xs text-cyan-400 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-600/30 hover:border-cyan-500/50 transition-colors"
                              >
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                                {sourceUrl ? (
                                  <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono flex-1 text-cyan-300 hover:text-cyan-200 hover:underline transition-colors cursor-pointer"
                                  >
                                    {sourceName}
                                  </a>
                                ) : (
                                  <span className="font-mono flex-1 text-cyan-300">
                                    {sourceName}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Disclaimer */}
                    {msg.disclaimer && msg.confidence < 40 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-xs text-amber-200 bg-amber-500/20 border border-amber-500/30 rounded-xl px-3 py-2 font-medium">
                          💡 {msg.disclaimer}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-xs text-gray-500 mt-2 font-medium">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 animate-messageSlide">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/40 animate-wiggle">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 px-6 py-4 rounded-3xl rounded-tl-md border border-slate-600/50 shadow-2xl">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce shadow-lg shadow-blue-400/50"></div>
                    <div
                      className="w-3 h-3 bg-purple-400 rounded-full animate-bounce shadow-lg shadow-purple-400/50"
                      style={{ animationDelay: "0.15s" }}
                    ></div>
                    <div
                      className="w-3 h-3 bg-pink-400 rounded-full animate-bounce shadow-lg shadow-pink-400/50"
                      style={{ animationDelay: "0.3s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900/50 via-slate-800/50 to-slate-900/50 border-t border-white/10 backdrop-blur-xl">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSend()
                  }
                  placeholder="Type your message..."
                  className="w-full bg-slate-800/80 border-2 border-slate-600/50 rounded-2xl px-6 py-4 pr-14 focus:outline-none focus:border-purple-500/60 focus:ring-4 focus:ring-purple-500/20 transition-all placeholder-slate-500 shadow-xl group-hover:border-slate-500/60 text-white"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed rounded-2xl p-4 transition-all transform hover:scale-110 active:scale-95 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 disabled:shadow-none overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                <Send className="w-6 h-6 relative z-10 transition-transform group-hover:rotate-12" />
              </button>
            </div>
            <div className="flex items-center justify-center mt-3 text-xs text-purple-400/70 font-medium">
              <span>Crafted with ❤️ by AskPal11</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
        .animate-messageSlide {
          animation: messageSlide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-fadeInDown {
          animation: fadeInDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 10s ease-in-out infinite 2s;
        }
        .animate-float-slow {
          animation: float 12s ease-in-out infinite 4s;
        }
        .animate-wiggle {
          animation: wiggle 3s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #ec4899);
          border-radius: 10px;
          border: 2px solid rgba(15, 23, 42, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #db2777);
        }
      `}</style>
    </div>
  );
}
