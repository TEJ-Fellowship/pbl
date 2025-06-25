// tech-master-LA/frontend/src/pages/AiChat.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChatInterface, ChatTitle } from "../components/chat";
import ChatHistory from "../components/chat/ChatHistory";
import chatService from "../services/chatService";
import { toast } from "react-toastify";
import { Plus, Menu } from "lucide-react";

const AiChat = () => {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [currentTopic, setCurrentTopic] = useState("New Chat");
  const navigate = useNavigate();

  // Load conversations and initialize
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const result = await chatService.getAllConversations();
      if (result.success) {
        setConversations(result.data.data || []);
        const loadedTopic = result.data.data[0]?.topic || "New Chat";
        setCurrentTopic(loadedTopic);

        // If no conversations exist, create a new one
        if (result.data.data.length === 0) {
          await createNewConversation();
        } else {
          // Load the most recent conversation
          const mostRecent = result.data.data[0];
          await loadConversation(mostRecent._id);
        }
      } else {
        toast.error("Failed to load conversations");
        await createNewConversation();
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversations");
      await createNewConversation();
    } finally {
      setIsInitializing(false);
    }
  };

  const createNewConversation = async () => {
    try {
      // Start loading indicator for creation
      setIsLoading(true);
      const result = await chatService.createConversation("New Chat");
      if (result.success && result.data) {
        const newConv = result.data;
        setConversationId(newConv._id);
        setMessages([]);
        setCurrentTopic(newConv.topic || "New Chat");
        // Add the new conversation to the top of the list locally
        setConversations((prev) => [newConv, ...prev]);
      } else {
        toast.error("Failed to create new conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create new conversation");
    } finally {
      // Stop loading indicator
      setIsLoading(false);
    }
  };

  const loadConversation = async (convId) => {
    try {
      setIsLoading(true);
      const result = await chatService.getConversation(convId);
      if (result.success && result.data) {
        setConversationId(convId);
        setCurrentTopic(result.data.topic || "General Chat");
        // Convert messages to frontend format
        const formattedMessages = result.data.messages.map((msg) => ({
          role: msg.displayRole || msg.role,
          content: msg.content,
        }));
        setMessages(formattedMessages);
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
      setMessages((prev) => [...prev, { role: "user", content: message }]);

      const result = await chatService.sendMessage(conversationId, message);

      if (result.success && result.data) {
        // Add AI response
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.data.message,
          },
        ]);

        // If a new topic was generated, update the state
        if (result.data.updatedTopic) {
          const newTopic = result.data.updatedTopic;
          setCurrentTopic(newTopic);
          // Update the topic in the main conversations list
          setConversations((prev) =>
            prev.map((conv) =>
              conv._id === conversationId ? { ...conv, topic: newTopic } : conv
            )
          );
        } else {
          // Fallback to refresh the list to update timestamps if no new topic was generated
          const conversationsResult = await chatService.getAllConversations();
          if (conversationsResult.success) {
            setConversations(conversationsResult.data.data || []);
          }
        }
      } else {
        // Remove user message if failed
        setMessages((prev) => prev.slice(0, -1));
        toast.error(result.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Message sending failed:", error);
      // Remove user message if failed
      setMessages((prev) => prev.slice(0, -1));
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

    if (messages.length < 2) {
      toast.error("Need at least one message exchange to generate a quiz");
      return;
    }

    setIsLoading(true);
    try {
      const result = await chatService.generateQuiz(conversationId);

      if (result.success && result.data) {
        // Navigate with the quiz data and the current topic
        navigate("/smart-quizzes", {
          state: {
            quiz: result.data,
            topic: currentTopic,
            fromChat: true,
          },
        });
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

  const handleDeleteConversation = async (convId) => {
    try {
      const result = await chatService.deleteConversation(convId);
      if (result.success) {
        // Remove from local state
        setConversations((prev) => prev.filter((conv) => conv._id !== convId));

        // If deleted conversation was active, create new one
        if (conversationId === convId) {
          await createNewConversation();
        }

        toast.success("Conversation deleted");
      } else {
        toast.error("Failed to delete conversation");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  if (isInitializing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <ChatTitle />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <div className="flex-grow flex bg-gray-900 rounded-lg overflow-hidden">
        {showHistory && (
          <ChatHistory
            conversations={conversations}
            onSelectConversation={loadConversation}
            onDeleteConversation={handleDeleteConversation}
            activeConversationId={conversationId}
            onNewChat={createNewConversation}
          />
        )}

        <div className="flex-1">
          {conversationId ? (
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onGenerateQuiz={handleGenerateQuiz}
              isLoading={isLoading}
              className="h-full"
              conversationTopic={currentTopic}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <p className="text-red-600 mb-4">Failed to initialize chat.</p>
                <button
                  onClick={createNewConversation}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiChat;
