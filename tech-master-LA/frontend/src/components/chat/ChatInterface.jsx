// tech-master-LA/frontend/src/components/chat/ChatInterface.jsx
import React, { useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import Message from "./Message";
import ChatInput from "./ChatInput";
import { Sparkles } from "lucide-react";

const ChatInterface = ({
  messages,
  onSendMessage,
  onGenerateQuiz,
  isLoading,
  className,
  conversationTopic = "New Chat",
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div
      className={`flex flex-col h-full backdrop-blur-sm bg-white/5 border-white/10 text-white shadow-2xl rounded-lg border-gray-700 ${className}`}
    >
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.length === 0 && !isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Sparkles className="mx-auto h-12 w-12 text-gray-500" />
              <h1 className="mt-4 text-2xl font-semibold text-white">
                {conversationTopic}
              </h1>
              <p className="text-gray-400 mt-2">
                Start a conversation by typing your message below.
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <Message key={index} message={message} index={index} />
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={onSendMessage}
        onGenerateQuiz={onGenerateQuiz}
        isLoading={isLoading}
        messagesExist={messages.length > 0}
      />
    </div>
  );
};

ChatInterface.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      role: PropTypes.oneOf(["user", "assistant"]).isRequired,
      content: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onGenerateQuiz: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  conversationTopic: PropTypes.string,
};

ChatInterface.defaultProps = {
  isLoading: false,
  className: "",
  conversationTopic: "New Chat",
};

export default ChatInterface;
