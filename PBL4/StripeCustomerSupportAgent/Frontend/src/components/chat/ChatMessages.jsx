import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const MessageBubble = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`flex items-start space-x-4 max-w-3xl ${
      message.sender === "user" ? "ml-auto flex-row-reverse" : ""
    }`}
  >
    <div
      className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
        message.sender === "user" ? "bg-gray-700" : "bg-primary"
      }`}
    >
      <span
        className={`material-symbols-outlined text-lg ${
          message.sender === "user" ? "text-white" : "text-white"
        }`}
      >
        {message.sender === "user" ? "person" : "auto_awesome"}
      </span>
    </div>
    <div
      className={`p-4 rounded-lg ${
        message.sender === "user"
          ? "bg-blue-600/80 text-white rounded-tr-none"
          : "bg-black/20 rounded-tl-none"
      }`}
    >
      {message.sender === "ai" && (
        <p className="font-semibold text-primary mb-1">Stitch.AI</p>
      )}
      <p className="text-text-dark">{message.text}</p>
    </div>
  </motion.div>
);

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start space-x-4 max-w-3xl"
  >
    <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
      <span className="material-symbols-outlined text-lg text-white">
        auto_awesome
      </span>
    </div>
    <div className="bg-black/20 p-4 rounded-lg rounded-tl-none">
      <p className="font-semibold text-primary mb-1">Stitch.AI</p>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  </motion.div>
);

const ChatMessages = ({ messages, isTyping, messagesEndRef }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-container">
      <AnimatePresence>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
