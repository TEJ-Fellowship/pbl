// tech-master-LA/frontend/src/components/chat/ChatInput.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ChatInput = ({ onSendMessage, onGenerateQuiz, isLoading, messagesExist }) => {
  const [input, setInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await onSendMessage(message);
  };

  return (
    <div className="p-4 border-t">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
        <button
          type="button"
          onClick={onGenerateQuiz}
          disabled={!messagesExist || isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          Generate Quiz
        </button>
      </form>
    </div>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onGenerateQuiz: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  messagesExist: PropTypes.bool,
};

ChatInput.defaultProps = {
  isLoading: false,
  messagesExist: false,
};

export default ChatInput;