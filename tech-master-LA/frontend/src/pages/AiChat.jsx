// tech-master-LA/frontend/src/pages/AiChat.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatInterface, ChatTitle } from '../components/chat';
import chatService from '../services/chatService';
import { toast } from 'react-toastify';

const AiChat = () => {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  // Initialize conversation when component mounts
  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    try {
      setIsInitializing(true);
      const result = await chatService.createConversation(
        "user123", // Replace with actual user ID from auth
        "General"
      );

      if (result.success && result.data) {
        console.log("Conversation initialized with ID:", result.data._id);
        setConversationId(result.data._id);
      } else {
        toast.error("Failed to initialize chat");
        console.error("Failed to initialize chat:", result.error);
      }
    } catch (error) {
      console.error("Initialization error:", error);
      toast.error("Failed to initialize chat");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (!message?.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!conversationId) {
      toast.error("Chat not initialized. Please try again.");
      return;
    }

    setIsLoading(true);
    console.log("Sending message with conversationId:", conversationId);

    try {
      // Add user message immediately
      setMessages(prev => [...prev, { role: 'user', content: message }]);

      const result = await chatService.sendMessage(conversationId, message);

      if (result.success && result.data) {
        // Add AI response
        setMessages(prev => [...prev, { 
          role: 'assistant', // We use 'assistant' in the frontend
          content: result.data.message 
        }]);
      } else {
        // Remove user message if failed
        setMessages(prev => prev.slice(0, -1));
        toast.error(result.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Message sending failed:", error);
      // Remove user message if failed
      setMessages(prev => prev.slice(0, -1));
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!conversationId) {
      toast.error("Chat not initialized. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await chatService.generateQuiz(conversationId);

      if (result.success) {
        navigate('/smart-quizzes', { state: { quiz: result.data } });
      } else {
        toast.error(result.error || "Failed to generate quiz");
      }
    } catch (error) {
      console.error("Quiz generation failed:", error);
      toast.error("Failed to generate quiz");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Initializing chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container  bg-black  mx-auto px-4 py-8">
     <ChatTitle />
      {conversationId ? (
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onGenerateQuiz={handleGenerateQuiz}
          isLoading={isLoading}
          className="max-w-4xl mx-auto"
        />
      ) : (
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <p className="text-red-600">Failed to initialize chat.</p>
          <button 
            onClick={initializeConversation}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default AiChat;