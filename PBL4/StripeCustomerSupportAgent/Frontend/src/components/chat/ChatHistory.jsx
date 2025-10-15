import React, { useState } from "react";
import { motion } from "framer-motion";

const ChatHistory = ({
  chatHistory,
  currentSessionId,
  handleNewChat,
  handleChatSelect,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-1/4 max-w-sm"
      } bg-black/20 backdrop-blur-sm border-r border-gray-800/50 flex flex-col transition-all duration-300`}
    >
      {/* Chat History Header */}
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-xl font-semibold">Chat History</h2>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-700 text-subtle-dark hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">
              {isCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </motion.button>
        </div>
        {!isCollapsed && (
          <div className="relative mt-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search history..."
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text-dark placeholder-gray-400 transition-all"
            />
          </div>
        )}
      </div>

      {/* Chat History List */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto chat-container">
          <div className="p-4 space-y-2">
            {chatHistory.map((chat) => {
              // Debug: Log chat object to see its structure
              console.log("Chat object:", chat);
              return (
                <motion.div
                  key={chat.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleChatSelect(chat.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === chat.sessionId
                      ? "bg-surface-dark-secondary border border-primary/50"
                      : "hover:bg-surface-dark-secondary/50"
                  }`}
                >
                  <p className="font-semibold text-sm truncate">{chat.title}</p>
                  <p className="text-xs text-subtle-dark truncate">
                    {chat.lastMessage}
                  </p>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {chat.timestamp
                      ? new Date(chat.timestamp).toLocaleDateString()
                      : "Unknown date"}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsed State - Show only icons */}
      {isCollapsed && (
        <div className="flex-1 overflow-y-auto chat-container">
          <div className="p-2 space-y-2">
            {chatHistory.slice(0, 5).map((chat) => (
              <motion.div
                key={chat.id}
                whileHover={{ scale: 1.1 }}
                onClick={() => handleChatSelect(chat.id)}
                className={`p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center ${
                  currentSessionId === chat.sessionId
                    ? "bg-primary/20 border border-primary/50"
                    : "hover:bg-surface-dark-secondary/50"
                }`}
                title={chat.title}
              >
                <span className="material-symbols-outlined text-sm">
                  {chat.sessionId === currentSessionId
                    ? "chat"
                    : "chat_bubble_outline"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Chat History Footer */}
      <div className="p-4 border-t border-gray-800/50">
        {isCollapsed ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewChat}
            className="w-full p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors flex items-center justify-center"
            title="New Chat"
          >
            <span className="material-symbols-outlined">add</span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewChat}
            className="w-full py-2 px-4 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors flex items-center justify-center space-x-2"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Chat</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
