// tech-master-LA/frontend/src/pages/AiChat.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatInterface, ChatTitle,ConversationTopic } from '../components/chat';
import chatService from '../services/chatService';
import { toast } from 'react-toastify';

const AiChat = () => {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const navigate = useNavigate();

  // Separate useEffect for fetching conversations
  useEffect(() => {
    const fetchInitialConversations = async () => {
      setIsLoadingConversations(true);
      try {
        const userId = "user123"; // Replace with actual user ID from auth
        const result = await chatService.getAllConversations(userId);
        if (result.success) {
          setConversations(result.data);
          
          // If there are conversations, set the most recent one
          if (result.data.length > 0) {
            const mostRecent = result.data[0];
            setConversationId(mostRecent._id);
            setMessages(mostRecent.messages || []);
          }
        } else {
          toast.error("Failed to fetch conversations");
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast.error("Failed to fetch conversations");
      } finally {
        setIsLoadingConversations(false);
      }
    };

    fetchInitialConversations();
  }, []); // This effect only runs once on mount

  // Separate useEffect for initializing conversation if needed
  useEffect(() => {
    const initializeIfNeeded = async () => {
      // Only initialize if:
      // 1. We're not currently loading conversations
      // 2. We have no conversations
      // 3. We don't have a conversationId set
      if (!isLoadingConversations && conversations.length === 0 && !conversationId) {
        try {
          setIsInitializing(true);
          const result = await chatService.createConversation(
            "user123", // Replace with actual user ID from auth
            "General"
          );

          if (result.success && result.data) {
            setConversationId(result.data._id);
            setConversations([result.data]); // Add to conversations list
            setMessages([]); // Initialize empty messages
          } else {
            toast.error("Failed to initialize chat");
          }
        } catch (error) {
          console.error("Initialization error:", error);
          toast.error("Failed to initialize chat");
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initializeIfNeeded();
  }, [conversations, conversationId, isLoadingConversations]);

  const fetchUserConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const userId = "user123"; // Replace with actual user ID from auth
      const result = await chatService.getAllConversations(userId);
      if (result.success) {
        setConversations(result.data);
      } else {
        toast.error("Failed to fetch conversations");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to fetch conversations");
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleSelectConversation = async (conversationId) => {
    try {
      setIsLoading(true);
      const result = await chatService.getConversationById(conversationId);
      if (result.success) {
        setConversationId(conversationId);
        setMessages(result.data.messages);
      } else {
        toast.error("Failed to load conversation");
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  };


  const initializeConversation = async () => {
    // This function is now only used for manual initialization (e.g., Retry button)
    if (isInitializing || isLoadingConversations) return;
    try {
      setIsInitializing(true);
      const result = await chatService.createConversation(
        "user123", // Replace with actual user ID from auth
        "General"
      );

      if (result.success && result.data) {
        setConversationId(result.data._id);
        setConversations(prev => [result.data, ...prev]); // Add to beginning of conversations list
        setMessages([]);
        toast.success("Chat initialized successfully");
        console.log("Conversation initialized with ID:", result.data._id);
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
  const handleDeleteConversation = async (deletedConversationId) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        const result = await chatService.deleteConversation(deletedConversationId);
        if (result.success) {
          // If the deleted conversation was the currently selected one
          if (deletedConversationId === conversationId) {
            setConversationId(null);
            setMessages([]);
            // Initialize a new conversation since current one was deleted
            await initializeConversation();
          }
          
          // Refresh the conversations list
          await fetchUserConversations();
          toast.success('Conversation deleted successfully');
        } else {
          toast.error('Failed to delete conversation');
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
        toast.error('Failed to delete conversation');
      }
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
         <div className="flex max-w-6xl mx-auto">
          <ConversationTopic
            conversations={conversations}
            selectedId={conversationId}
            onSelect={handleSelectConversation}
            onDelete={handleDeleteConversation}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isLoading={isLoadingConversations}
          />
          <div className={`flex-1 transition-all ${isSidebarOpen ? 'ml-4' : ''}`}>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onGenerateQuiz={handleGenerateQuiz}
              isLoading={isLoading}
            />
          </div>
        </div>
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