import { useState, useRef, useEffect } from "react";
import { apiService } from "../services/api.js";

export const useIntegratedChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your enhanced Stripe.AI assistant with full MCP tool integration. I can help you with Stripe integration, calculations, status checks, and more!",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    try {
      return localStorage.getItem("stripe_integrated_current_session") || null;
    } catch (error) {
      console.error("Failed to load current integrated session:", error);
      return null;
    }
  });
  const [error, setError] = useState(null);
  const [sources, setSources] = useState([]);
  const [confidence, setConfidence] = useState(null);
  const [mcpToolsUsed, setMcpToolsUsed] = useState([]);
  const [mcpConfidence, setMcpConfidence] = useState(null);
  const [classification, setClassification] = useState(null);
  const [systemStatus, setSystemStatus] = useState({
    mcp: null,
    classifier: null,
    health: null,
  });
  const [tokenUsage, setTokenUsage] = useState({
    currentTokens: 0,
    maxTokens: 4000,
    usagePercentage: 0,
    isNearLimit: false,
    isAtLimit: false,
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Save current integrated session to localStorage (for persistence across page reloads)
  const saveCurrentSession = (sessionId) => {
    try {
      localStorage.setItem("stripe_integrated_current_session", sessionId);
    } catch (error) {
      console.error("Failed to save current integrated session:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save current session whenever it changes
  useEffect(() => {
    if (currentSessionId) {
      saveCurrentSession(currentSessionId);
    }
  }, [currentSessionId]);

  // Initialize integrated chat session on component mount
  useEffect(() => {
    loadSessionsFromDatabase();
    loadExistingSession();
    fetchSystemStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch token usage when session changes
  useEffect(() => {
    if (currentSessionId) {
      fetchTokenUsage(currentSessionId);
    }
  }, [currentSessionId]);

  const loadSessionsFromDatabase = async () => {
    try {
      console.log("🔄 Loading sessions from database...");
      setIsLoadingSessions(true);
      const response = await apiService.getAllSessions("web_user", 50, 0);

      if (response.success && response.data.sessions) {
        const formattedSessions = response.data.sessions.map(
          (session, index) => ({
            id: session.id || index + 1,
            sessionId: session.sessionId,
            title:
              session.title || `Session ${session.sessionId.substring(0, 8)}`,
            lastMessage: session.lastMessage || "No messages yet",
            timestamp: new Date(session.timestamp),
            messageCount: session.messageCount || 0,
            type: "integrated",
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            isActive: session.isActive,
            hasSummary: session.hasSummary,
          })
        );

        setChatHistory(formattedSessions);
        console.log(
          "✅ Sessions loaded from database:",
          formattedSessions.length
        );
      }
    } catch (error) {
      console.error("❌ Failed to load sessions from database:", error.message);
      // Fallback to localStorage if database fails
      try {
        const saved = localStorage.getItem("stripe_integrated_chat_history");
        if (saved) {
          setChatHistory(JSON.parse(saved));
          console.log("📱 Fallback to localStorage sessions");
        }
      } catch (localError) {
        console.error("❌ Failed to load from localStorage:", localError);
      }
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadExistingSession = async () => {
    try {
      if (currentSessionId) {
        console.log(
          "🔄 Loading existing integrated session:",
          currentSessionId
        );
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
              mcpToolsUsed: msg.metadata?.mcpToolsUsed,
              mcpConfidence: msg.metadata?.mcpConfidence,
              classification: msg.metadata?.classification,
            })
          );

          setMessages(formattedMessages);
          console.log(
            "✅ Existing integrated session loaded:",
            formattedMessages.length,
            "messages"
          );
        } else {
          await initializeSession();
        }
      } else {
        await initializeSession();
      }
    } catch (error) {
      console.log(
        "❌ Failed to load existing integrated session:",
        error.message
      );
      await initializeSession();
    }
  };

  const initializeSession = async (forceNew = false) => {
    try {
      if (currentSessionId && !forceNew) {
        console.log("✅ Using existing integrated session:", currentSessionId);
        return;
      }

      console.log("🔄 Initializing new integrated chat session...");
      const response = await apiService.createSession("web_user", {
        project: "stripe_support",
        context: "customer_support_with_mcp",
      });
      setCurrentSessionId(response.data.sessionId);
      console.log(
        "✅ Integrated session initialized:",
        response.data.sessionId
      );
    } catch (error) {
      console.log("❌ Integrated session init failed:", error.message);
      setError("Failed to initialize integrated chat session");
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
      console.log(
        "💬 Sending integrated message:",
        messageText.substring(0, 50) + "..."
      );
      const response = await apiService.sendIntegratedMessage(
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
        sources: response.data.sources || [],
        mcpToolsUsed: Array.isArray(response.data.mcpToolsUsed)
          ? response.data.mcpToolsUsed
          : [],
        mcpConfidence: response.data.mcpConfidence,
        classification: response.data.classification,
        reasoning: response.data.reasoning,
        searchQuery: response.data.searchQuery,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setSources(response.data.sources || []);
      setConfidence(response.data.confidence);
      setMcpToolsUsed(
        Array.isArray(response.data.mcpToolsUsed)
          ? response.data.mcpToolsUsed
          : []
      );
      setMcpConfidence(response.data.mcpConfidence);
      setClassification(response.data.classification);

      console.log(
        "✅ Integrated message received:",
        response.data.message.substring(0, 50) + "..."
      );
      console.log("📊 Confidence:", response.data.confidence);
      console.log(
        "🔧 MCP Tools Used:",
        response.data.mcpToolsUsed,
        "Type:",
        typeof response.data.mcpToolsUsed,
        "Is Array:",
        Array.isArray(response.data.mcpToolsUsed)
      );
      console.log("📊 MCP Confidence:", response.data.mcpConfidence);
      console.log("📊 Classification:", response.data.classification);
      console.log("📚 Sources:", response.data.sources?.length || 0);
      console.log("🔍 Full API Response:", response.data);
      console.log("🔍 Sources Details:", response.data.sources);

      // Update chat history
      await updateChatHistory(messageText);

      // Fetch updated token usage after message
      setTimeout(() => {
        fetchTokenUsage(currentSessionId);
      }, 500);
    } catch (error) {
      console.log("❌ Integrated message failed:", error.message);
      setError(error.message || "Failed to send integrated message");

      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I encountered an error with the integrated system. Please try again.",
        sender: "ai",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const updateChatHistory = async (userMessage) => {
    try {
      // Update local state immediately for UI responsiveness
      const currentChat = chatHistory.find(
        (chat) => chat.sessionId === currentSessionId
      );

      if (currentChat) {
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
          type: "integrated",
        };
        setChatHistory((prev) => [newChat, ...prev]);
      }

      // Sync with database by reloading sessions
      await loadSessionsFromDatabase();
    } catch (error) {
      console.error("❌ Failed to update chat history:", error);
    }
  };

  const handleNewChat = async () => {
    try {
      console.log("🆕 Creating new integrated chat session...");
      const response = await apiService.createSession("web_user", {
        project: "stripe_support",
        context: "customer_support_with_mcp",
      });

      setCurrentSessionId(response.data.sessionId);
      setMessages([
        {
          id: 1,
          text: "Hello! I'm your enhanced Stripe.AI assistant with full MCP tool integration. I can help you with Stripe integration, calculations, status checks, and more!",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      setSources([]);
      setConfidence(null);
      setMcpToolsUsed([]);
      setMcpConfidence(null);
      setClassification(null);
      setError(null);

      // Reload sessions from database to include the new session
      await loadSessionsFromDatabase();

      console.log(
        "✅ New integrated session created:",
        response.data.sessionId
      );
    } catch (error) {
      console.log("❌ New integrated session failed:", error.message);
      setError("Failed to create new integrated chat session");
    }
  };

  const handleChatSelect = async (chatId) => {
    const selectedChat = chatHistory.find((chat) => chat.id === chatId);
    if (!selectedChat) {
      console.log("❌ Integrated chat not found:", chatId);
      return;
    }

    try {
      console.log(
        "📂 Loading integrated chat history:",
        selectedChat.sessionId
      );
      const response = await apiService.getHistory(selectedChat.sessionId);

      setCurrentSessionId(selectedChat.sessionId);

      if (!response.data.messages || response.data.messages.length === 0) {
        setMessages([
          {
            id: 1,
            text: "No previous messages found for this integrated conversation.",
            sender: "ai",
            timestamp: new Date(),
          },
        ]);
        setError("No previous messages found for this integrated conversation");
        return;
      }

      const formattedMessages = response.data.messages.map((msg, index) => ({
        id: msg.id || index + 1,
        text: msg.content,
        sender: msg.type === "user" ? "user" : "ai",
        timestamp: new Date(msg.timestamp),
        confidence: msg.metadata?.confidence,
        sources: msg.metadata?.sources,
        mcpToolsUsed: msg.metadata?.mcpToolsUsed,
        mcpConfidence: msg.metadata?.mcpConfidence,
        classification: msg.metadata?.classification,
      }));

      setMessages(formattedMessages);
      setSources([]);
      setConfidence(null);
      setMcpToolsUsed([]);
      setMcpConfidence(null);
      setClassification(null);
      setError(null);
      console.log(
        "✅ Integrated chat history loaded:",
        formattedMessages.length,
        "messages"
      );
    } catch (error) {
      console.log("❌ Integrated history load failed:", error.message);
      setError("Failed to load integrated chat history");
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

  const clearAllData = async () => {
    try {
      console.log("🗑️ Clearing all integrated data...");

      // Clear localStorage
      localStorage.removeItem("stripe_integrated_chat_history");
      localStorage.removeItem("stripe_integrated_current_session");

      // Clear local state
      setChatHistory([]);
      setCurrentSessionId(null);
      setMessages([
        {
          id: 1,
          text: "Hello! I'm your enhanced Stripe.AI assistant with full MCP tool integration. I can help you with Stripe integration, calculations, status checks, and more!",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      setSources([]);
      setConfidence(null);
      setMcpToolsUsed([]);
      setMcpConfidence(null);
      setClassification(null);
      setError(null);

      // Reload sessions from database to get fresh state
      await loadSessionsFromDatabase();

      console.log("✅ All integrated data cleared");
    } catch (error) {
      console.error("❌ Failed to clear integrated data:", error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      console.log("🗑️ Deleting integrated chat:", chatId);
      const chatToDelete = chatHistory.find((chat) => chat.id === chatId);
      if (!chatToDelete) {
        console.error("❌ Integrated chat not found:", chatId);
        return;
      }

      await apiService.deleteSession(chatToDelete.sessionId);

      // Reload sessions from database to reflect the deletion
      await loadSessionsFromDatabase();

      if (currentSessionId === chatToDelete.sessionId) {
        setMessages([]);
        setSources([]);
        setConfidence(null);
        setMcpToolsUsed([]);
        setMcpConfidence(null);
        setClassification(null);
        setError(null);

        // Check if there are any sessions left after deletion
        const remainingSessions = chatHistory.filter(
          (chat) => chat.id !== chatId
        );
        if (remainingSessions.length === 0) {
          console.log(
            "🆕 Last integrated chat deleted, starting fresh session"
          );
          await initializeSession(true);
        }
      }

      console.log("✅ Integrated chat deleted successfully:", chatId);
    } catch (error) {
      console.error("❌ Failed to delete integrated chat:", error);
      setError("Failed to delete integrated chat. Please try again.");
    }
  };

  const fetchTokenUsage = async (sessionId) => {
    try {
      if (!sessionId) return;
      const response = await apiService.getTokenUsage(sessionId);
      if (response.success) {
        setTokenUsage({
          currentTokens: response.data.currentTokens,
          maxTokens: response.data.maxTokens,
          usagePercentage: response.data.usagePercentage,
          isNearLimit: response.data.isNearLimit,
          isAtLimit: response.data.isAtLimit,
        });
      }
    } catch (error) {
      console.error("❌ Failed to fetch token usage:", error);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      console.log("🔧 Fetching integrated system status...");
      const [mcpStatus, classifierStatus, healthStatus] =
        await Promise.allSettled([
          apiService.getMCPStatus(),
          apiService.getClassifierStatus(),
          apiService.getIntegratedHealth(),
        ]);

      setSystemStatus({
        mcp: mcpStatus.status === "fulfilled" ? mcpStatus.value.data : null,
        classifier:
          classifierStatus.status === "fulfilled"
            ? classifierStatus.value.data
            : null,
        health:
          healthStatus.status === "fulfilled" ? healthStatus.value.data : null,
      });

      console.log("✅ System status fetched");
    } catch (error) {
      console.error("❌ Failed to fetch system status:", error);
    }
  };

  const handleTokenLimitReached = async () => {
    try {
      console.log("⚠️ Token limit reached, creating new integrated session...");
      setMessages([]);
      setSources([]);
      setConfidence(null);
      setMcpToolsUsed([]);
      setMcpConfidence(null);
      setClassification(null);
      setError(null);
      await initializeSession(true);
      setError("Token limit reached. Started a new integrated conversation.");
    } catch (error) {
      console.error("❌ Failed to create new integrated session:", error);
      setError(
        "Token limit reached but failed to create new integrated session."
      );
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    chatHistory,
    isLoadingSessions,
    currentSessionId,
    messagesEndRef,
    error,
    sources,
    confidence,
    mcpToolsUsed,
    mcpConfidence,
    classification,
    systemStatus,
    tokenUsage,
    handleSendMessage,
    handleNewChat,
    handleChatSelect,
    handleDeleteChat,
    handleTokenLimitReached,
    handleKeyPress,
    clearError,
    clearAllData,
    fetchSystemStatus,
  };
};
