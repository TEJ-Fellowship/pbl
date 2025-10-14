import React, { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, Bot, User, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Link } from "react-router-dom";

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your MailChimp support assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Simulate bot response (replace with actual API call)
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        text: "I understand you're asking about: " + inputText + ". Let me help you with that. This is a simulated response - in a real implementation, this would connect to your MailChimp support API.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gradient-to-r from-yellow-400/20 to-blue-400/20 px-8 py-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-600 hover:text-yellow-600">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-yellow-400/20">
              <Bot size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">MailChimp Support Assistant</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-green-600 font-medium">Online</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-100/80 px-4 py-2 rounded-full">
          <p className="text-sm text-gray-600 font-medium">{new Date().toLocaleDateString()}</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.sender === "bot" && (
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl ring-2 ring-yellow-400/20">
                <Bot size={20} className="text-black" />
              </div>
            )}
            
            <div
              className={`max-w-[75%] rounded-3xl px-6 py-5 shadow-lg ${
                message.sender === "user"
                  ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 text-black ring-2 ring-yellow-400/20"
                  : "bg-white/90 text-gray-900 border border-gray-200/50 backdrop-blur-sm ring-1 ring-gray-200/30"
              }`}
            >
              <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">
                {message.text}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {message.timestamp}
                </span>
                {message.sender === "bot" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyToClipboard(message.text)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Copy"
                    >
                      <Copy size={12} className="text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="Good response">
                      <ThumbsUp size={12} className="text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="Poor response">
                      <ThumbsDown size={12} className="text-gray-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {message.sender === "user" && (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl ring-2 ring-blue-400/20">
                <User size={20} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl ring-2 ring-yellow-400/20">
              <Bot size={20} className="text-black" />
            </div>
            <div className="bg-white/90 border border-gray-200/50 rounded-3xl px-6 py-5 shadow-lg backdrop-blur-sm ring-1 ring-gray-200/30">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white/90 backdrop-blur-md border-t border-gradient-to-r from-yellow-400/20 to-blue-400/20 px-8 py-6 shadow-xl">
        <div className="flex gap-3 items-start">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about MailChimp..."
              className="w-full px-6 py-4 border border-gray-300/30 rounded-3xl resize-none focus:outline-none focus:ring-4 focus:ring-yellow-400/30 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-lg scrollbar-hide transition-all duration-300 flex items-center"
              rows="1"
              style={{ 
                height: "56px", 
                maxHeight: "120px", 
                MozAppearance: "textfield",
                WebkitAppearance: "none",
                appearance: "none",
                scrollbarWidth: "none",
                msOverflowStyle: "none"
              }}
            />
          </div>
          <div className="flex items-center" style={{ height: "56px" }}>
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 text-black rounded-3xl hover:from-yellow-500 hover:via-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-110 ring-2 ring-yellow-400/20"
              style={{ height: "56px", width: "56px" }}
            >
              <Send size={22} />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4 text-center font-semibold bg-gray-100/80 px-4 py-2 rounded-full">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatPage;
