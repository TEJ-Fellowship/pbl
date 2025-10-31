import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

const MessageInput = ({ onSendMessage, isLoading, theme = "dark" }) => {
  const isDark = theme === "dark";
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  // Handle suggestion clicks from the welcome screen
  useEffect(() => {
    const handleSuggestionClick = (event) => {
      setMessage(event.detail);
      textareaRef.current?.focus();
    };

    window.addEventListener("suggestionClick", handleSuggestionClick);
    return () =>
      window.removeEventListener("suggestionClick", handleSuggestionClick);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div
      className={`border-t p-4 ${
        isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"
      }`}
    >
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-3 max-w-4xl mx-auto"
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Twilio Support..."
            className={`w-full px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm ${
              isDark
                ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
            } border`}
            rows={1}
            disabled={isLoading}
            style={{ minHeight: "52px", maxHeight: "200px" }}
          />
        </div>

        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 flex-shrink-0 ${
            message.trim() && !isLoading
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-emerald-500/20"
              : isDark
              ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>

      {/* Quick suggestions */}
      <div className="mt-3 flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
        {[
          "SMS API",
          "Voice calls",
          "WhatsApp",
          "Error codes",
          "Webhooks",
          "Authentication",
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setMessage(suggestion)}
            disabled={isLoading}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors border disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700 hover:border-emerald-500/30"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-400"
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MessageInput;
