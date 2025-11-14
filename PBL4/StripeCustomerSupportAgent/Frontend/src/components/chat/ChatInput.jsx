import React from "react";
import { motion } from "framer-motion";

const ChatInput = ({
  inputValue = "",
  setInputValue,
  handleSendMessage,
  handleKeyPress,
}) => {
  return (
    <div className="p-3 border-t border-gray-800/50">
      <div className="relative bg-black/20 rounded-xl p-2 flex items-center space-x-2">
        <button className="p-2 rounded-lg hover:bg-gray-700 text-subtle-dark hover:text-white transition-colors">
          <span className="material-symbols-outlined">add_circle</span>
        </button>
        <input
          value={inputValue || ""}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          className="flex-1 bg-transparent border-none text-text-dark placeholder-subtle-dark focus:ring-0 focus:outline-none"
        />
        {/* mic removed */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSendMessage}
          disabled={!inputValue || !inputValue.trim()}
          className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center space-x-2 disabled:bg-gray-700 disabled:text-subtle-dark disabled:cursor-not-allowed"
        >
          <span>Send</span>
          <span className="material-symbols-outlined">send</span>
        </motion.button>
      </div>
      <p className="text-xs text-subtle-dark text-center mt-2 whitespace-nowrap">
        Stitch.AI can make mistakes. Try{" "}
        <span className="text-blue-400 font-mono">sample</span> for examples or{" "}
        <span className="text-blue-400 font-mono">mcp</span> for system status.
      </p>
    </div>
  );
};

export default ChatInput;
