// tech-master-LA/frontend/src/components/chat/ChatInterface.jsx
import React, { useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import Message from './Message';
import ChatInput from './ChatInput';

const ChatInterface = ({ 
  messages, 
  onSendMessage, 
  onGenerateQuiz, 
  isLoading, 
  className 
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={`flex flex-col h-[80vh] backdrop-blur-sm bg-white/5  border-white/10 text-white shadow-2xl rounded-lg border border-gray-700 ${className}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {messages.map((message, index) => (
            <Message 
              key={index} 
              message={message} 
              index={index} 
            />
          ))}
        </AnimatePresence>
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
      role: PropTypes.oneOf(['user', 'assistant']).isRequired,
      content: PropTypes.string.isRequired
    })
  ).isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onGenerateQuiz: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  className: PropTypes.string
};

ChatInterface.defaultProps = {
  isLoading: false,
  className: "",
};

export default ChatInterface;