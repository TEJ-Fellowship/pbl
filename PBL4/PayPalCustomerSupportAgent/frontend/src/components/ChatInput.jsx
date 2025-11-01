import React from "react";
import { Send } from "lucide-react";

/**
 * ChatInput component - handles message input and sending
 */
export default function ChatInput({ input, setInput, onSend, isTyping }) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-[#343541] border-t border-white/10 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message PayPal AI..."
            className="flex-1 bg-[#40414f] border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
            disabled={isTyping}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || isTyping}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
