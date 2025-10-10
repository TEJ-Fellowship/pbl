import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

const MessageInput = ({ onSendMessage, isLoading }) => {
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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Twilio APIs, SMS, Voice, Video, WhatsApp..."
            className="w-full px-4 py-3 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 text-sm"
            rows={1}
            disabled={isLoading}
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          <div className="absolute bottom-2 right-2 text-xs text-slate-400">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>

        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
            message.trim() && !isLoading
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
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
      <div className="mt-3 flex flex-wrap gap-2">
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
            className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MessageInput;
