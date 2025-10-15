import { useState, useRef, useEffect } from "react";
import { apiService } from "../services/api.js";

export const useChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your Stripe.AI assistant. How can I help you with Stripe integration or billing questions today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState(() => {
    // Load chat history from localStorage on initialization
    try {
      const saved = localStorage.getItem("stripe_chat_history");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to load chat history from localStorage:", error);
      return [];
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    // Load current session from localStorage
    try {
      return localStorage.getItem("stripe_current_session") || null;
    } catch (error) {
      console.error("Failed to load current session from localStorage:", error);
      return null;
    }
  });
  const [error, setError] = useState(null);
  const [sources, setSources] = useState([]);
  const [confidence, setConfidence] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Save chat history to localStorage
  const saveChatHistory = (history) => {
    try {
      localStorage.setItem("stripe_chat_history", JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save chat history to localStorage:", error);
    }
  };

  // Save current session to localStorage
  const saveCurrentSession = (sessionId) => {
    try {
      localStorage.setItem("stripe_current_session", sessionId);
    } catch (error) {
      console.error("Failed to save current session to localStorage:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save chat history whenever it changes
  useEffect(() => {
    saveChatHistory(chatHistory);
  }, [chatHistory]);

  // Save current session whenever it changes
  useEffect(() => {
    if (currentSessionId) {
      saveCurrentSession(currentSessionId);
    }
  }, [currentSessionId]);

  // Initialize chat session on component mount
  useEffect(() => {
    loadExistingSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadExistingSession = async () => {
    try {
      // If we have a current session, try to load its history
      if (currentSessionId) {
        console.log("🔄 Loading existing session:", currentSessionId);
        const response = await apiService.getHistory(currentSessionId);

        if (response.data.messages.length > 0) {
          const formattedMessages = response.data.messages.map(
            (msg, index) => ({
              id: msg.id || index + 1,
              text: msg.content,
              sender: msg.type === "user" ? "user" : "ai",
              timestamp: new Date(msg.timestamp),
              confidence: msg.metadata?.confidence,
              sources: msg.metadata?.sources,
            })
          );

          setMessages(formattedMessages);
          console.log(
            "✅ Existing session loaded:",
            formattedMessages.length,
            "messages"
          );
        } else {
          // No messages in existing session, initialize new one
          await initializeSession();
        }
      } else {
        // No existing session, create new one
        await initializeSession();
      }
    } catch (error) {
      console.log("❌ Failed to load existing session:", error.message);
      // Fallback to creating new session
      await initializeSession();
    }
  };

  // NEW: Sync chat history with database on app start
  const syncChatHistoryWithDatabase = async () => {
    try {
      console.log("🔄 Syncing chat history with database...");

      // Get all sessions from database
      const response = await apiService.getSessions();

      if (response.data && response.data.sessions) {
        // Convert database sessions to frontend format
        const dbChatHistory = response.data.sessions.map((session) => ({
          id: session.sessionId,
          sessionId: session.sessionId,
          title: session.title || `Chat ${session.sessionId.substring(0, 8)}`,
          lastMessage: session.lastMessage || "No messages",
          timestamp: new Date(session.createdAt),
          messageCount: session.messageCount || 0,
        }));

        // Update localStorage and state
        setChatHistory(dbChatHistory);
        console.log(
          "✅ Chat history synced with database:",
          dbChatHistory.length,
          "sessions"
        );
      }
    } catch (error) {
      console.log(
        "⚠️ Could not sync with database, using localStorage:",
        error.message
      );
      // Fallback to localStorage data
    }
  };

  const initializeSession = async () => {
    try {
      // If we already have a session, don't create a new one
      if (currentSessionId) {
        console.log("✅ Using existing session:", currentSessionId);
        return;
      }

      console.log("🔄 Initializing new chat session...");
      const response = await apiService.createSession("web_user", {
        project: "stripe_support",
        context: "customer_support",
      });
      setCurrentSessionId(response.data.sessionId);
      console.log("✅ Session initialized:", response.data.sessionId);
    } catch (error) {
      console.log("❌ Session init failed:", error.message);
      setError("Failed to initialize chat session");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue("");
    setIsTyping(true);
    setError(null);

    try {
      console.log("💬 Sending message:", messageText.substring(0, 50) + "...");
      const response = await apiService.sendMessage(
        messageText,
        currentSessionId,
        "web_user"
      );

      const aiMessage = {
        id: Date.now() + 1,
        text: response.data.message,
        sender: "ai",
        timestamp: new Date(),
        confidence: response.data.confidence,
        sources: response.data.sources,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setSources(response.data.sources || []);
      setConfidence(response.data.confidence);

      console.log(
        "✅ Message received:",
        response.data.message.substring(0, 50) + "..."
      );
      console.log("📊 Confidence:", response.data.confidence);
      console.log("📚 Sources:", response.data.sources?.length || 0);

      // Update chat history
      updateChatHistory(messageText);
    } catch (error) {
      console.log("❌ Message failed:", error.message);
      setError(error.message || "Failed to send message");

      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I encountered an error. Please try again.",
        sender: "ai",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const updateChatHistory = (userMessage) => {
    const currentChat = chatHistory.find(
      (chat) => chat.sessionId === currentSessionId
    );

    if (currentChat) {
      // Update existing chat
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.sessionId === currentSessionId
            ? {
                ...chat,
                lastMessage: userMessage,
                timestamp: new Date(),
                messageCount: chat.messageCount + 1,
              }
            : chat
        )
      );
    } else {
      // Create new chat entry
      const newChat = {
        id: Date.now(),
        sessionId: currentSessionId,
        title:
          userMessage.length > 30
            ? userMessage.substring(0, 30) + "..."
            : userMessage,
        lastMessage: userMessage,
        timestamp: new Date(),
        messageCount: 1,
      };
      setChatHistory((prev) => [newChat, ...prev]);
    }
  };

  const handleNewChat = async () => {
    try {
      console.log("🆕 Creating new chat session...");
      const response = await apiService.createSession("web_user", {
        project: "stripe_support",
        context: "customer_support",
      });

      setCurrentSessionId(response.data.sessionId);
      setMessages([
        {
          id: 1,
          text: "Hello! I'm your Stripe.AI assistant. How can I help you with Stripe integration or billing questions today?",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      setSources([]);
      setConfidence(null);
      setError(null);
      console.log("✅ New session created:", response.data.sessionId);
    } catch (error) {
      console.log("❌ New session failed:", error.message);
      setError("Failed to create new chat session");
    }
  };

  const handleChatSelect = async (chatId) => {
    const selectedChat = chatHistory.find((chat) => chat.id === chatId);
    if (!selectedChat) {
      console.log("❌ Chat not found:", chatId);
      return;
    }

    try {
      console.log("📂 Loading chat history:", selectedChat.sessionId);
      console.log("📋 Selected chat:", selectedChat);

      // Load conversation history for the selected session
      const response = await apiService.getHistory(selectedChat.sessionId);
      console.log("📥 API Response:", response);

      setCurrentSessionId(selectedChat.sessionId);

      // Check if we have messages
      if (!response.data.messages || response.data.messages.length === 0) {
        console.log("⚠️ No messages found in response");
        setMessages([
          {
            id: 1,
            text: "No previous messages found for this conversation. This might be a new session or the messages haven't been saved yet.",
            sender: "ai",
            timestamp: new Date(),
          },
        ]);
        setError("No previous messages found for this conversation");
        return;
      }

      // Convert API messages to UI format
      const formattedMessages = response.data.messages.map((msg, index) => ({
        id: msg.id || index + 1,
        text: msg.content,
        sender: msg.type === "user" ? "user" : "ai",
        timestamp: new Date(msg.timestamp),
        confidence: msg.metadata?.confidence,
        sources: msg.metadata?.sources,
      }));

      console.log("🔄 Formatted messages:", formattedMessages);
      setMessages(formattedMessages);
      setSources([]);
      setConfidence(null);
      setError(null);
      console.log(
        "✅ Chat history loaded:",
        formattedMessages.length,
        "messages"
      );
    } catch (error) {
      console.log("❌ History load failed:", error.message);
      setError("Failed to load chat history");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearError = () => {
    setError(null);
  };

  // NEW: Clear all data and sync with database
  const clearAllData = () => {
    try {
      console.log("🗑️ Clearing all local data...");

      // Clear localStorage
      localStorage.removeItem("stripe_chat_history");
      localStorage.removeItem("stripe_current_session");

      // Reset state
      setChatHistory([]);
      setCurrentSessionId(null);
      setMessages([
        {
          id: 1,
          text: "Hello! I'm your Stripe.AI assistant. How can I help you with Stripe integration or billing questions today?",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      setSources([]);
      setConfidence(null);
      setError(null);

      console.log("✅ All local data cleared");
    } catch (error) {
      console.error("❌ Failed to clear data:", error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      console.log("🗑️ Deleting chat:", chatId);

      // Find the chat to get sessionId
      const chatToDelete = chatHistory.find((chat) => chat.id === chatId);
      if (!chatToDelete) {
        console.error("❌ Chat not found:", chatId);
        return;
      }

      // Call API to delete session
      await apiService.deleteSession(chatToDelete.sessionId);

      // Remove from local state
      const updatedHistory = chatHistory.filter((chat) => chat.id !== chatId);
      setChatHistory(updatedHistory);
      saveChatHistory(updatedHistory);

      // If we're deleting the current session, start a new one
      if (currentSessionId === chatToDelete.sessionId) {
        await initializeSession();
      }

      console.log("✅ Chat deleted successfully:", chatId);
    } catch (error) {
      console.error("❌ Failed to delete chat:", error);
      setError("Failed to delete chat. Please try again.");
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    chatHistory,
    currentSessionId,
    messagesEndRef,
    error,
    sources,
    confidence,
    handleSendMessage,
    handleNewChat,
    handleChatSelect,
    handleDeleteChat,
    handleKeyPress,
    clearError,
    clearAllData,
    syncChatHistoryWithDatabase,
  };
};
