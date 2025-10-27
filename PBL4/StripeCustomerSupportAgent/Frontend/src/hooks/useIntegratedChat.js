import { useState, useRef, useEffect } from "react";
import { apiService } from "../services/api.js";

export const useIntegratedChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your enhanced Stripe.AI assistant with full MCP tool integration. I can help you with Stripe integration, calculations, status checks, and more!\n\n💡 **Quick Commands:**\n• Type `sample` to see example questions\n• Type `mcp` to check system status\n• Ask me anything about Stripe!",
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

    const messageText = inputValue.trim();

    // Check for special commands
    if (messageText.toLowerCase() === "sample") {
      handleSampleCommand();
      setInputValue("");
      return;
    }

    if (messageText.toLowerCase() === "mcp") {
      handleMCPCommand();
      setInputValue("");
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
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
        // Generate a better title from the user message
        const cleanMessage = userMessage
          .replace(/[^\w\s]/g, "") // Remove special characters
          .trim();

        const title =
          cleanMessage.length > 50
            ? cleanMessage.substring(0, 50) + "..."
            : cleanMessage || "New Conversation";

        const newChat = {
          id: Date.now(),
          sessionId: currentSessionId,
          title: title,
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

  /**
   * Handle sample command - show example questions
   */
  const handleSampleCommand = () => {
    const sampleMessage = {
      id: Date.now(),
      text: `💡 **Example Questions by Classification:**

**🔧 MCP_TOOLS_ONLY Examples:**
• What's Stripe's fee for $1000? (Calculator Tool)
• Is Stripe down right now? (Status Checker Tool)
• What time is it now? (DateTime Tool)
• Search for latest Stripe API updates (Web Search Tool)
• Validate this endpoint: /v1/charges (Code Validator Tool)
• Convert $50 USD to Nepali rupee (Currency Converter Tool)

**📚 HYBRID_SEARCH Examples:**
• How do I create a payment intent with Stripe?
• How to handle Stripe API errors and exceptions?
• What are webhook signatures and how do I verify them?
• How do I set up subscription billing with Stripe?
• How to handle refunds and disputes?
• How to implement multi-party payments?

**🔧📚 COMBINED Examples:**
• Calculate Stripe fees for $500 and show me the API implementation
• Is Stripe working and how do I implement webhooks?
• What's the current status and how do I handle disputes?
• Calculate fees and show me how to set up billing

**💡 Commands:**
• Type 'mcp' to check MCP system status
• Type 'sample' to see this help again`,
      sender: "ai",
      timestamp: new Date(),
      isCommand: true,
    };

    setMessages((prev) => [...prev, sampleMessage]);
  };

  /**
   * Handle MCP command - show MCP system status
   */
  const handleMCPCommand = async () => {
    try {
      setIsTyping(true);

      // Fetch MCP status
      const mcpStatus = await apiService.getMCPStatus();
      const classifierStatus = await apiService.getClassifierStatus();

      let mcpInfo = "🔧 **MCP System Status:**\n\n";

      if (mcpStatus.success && mcpStatus.data) {
        const status = mcpStatus.data;
        mcpInfo += `**Integration:** ${
          status.integrationEnabled ? "✅ Enabled" : "❌ Disabled"
        }\n`;
        mcpInfo += `**Tools Available:** ${
          status.availableTools?.length || status.status?.total || 0
        }\n`;
        mcpInfo += `**Tools Enabled:** ${status.status?.enabled || 0}\n`;
        mcpInfo += `**Tools Disabled:** ${status.status?.disabled || 0}\n\n`;

        if (status.status?.details) {
          mcpInfo += "**🛠️ Tool Details:**\n";
          Object.entries(status.status.details).forEach(
            ([toolName, details]) => {
              const statusIcon = details.enabled ? "✅" : "❌";
              mcpInfo += `${statusIcon} ${toolName}: ${details.description}\n`;
            }
          );
          mcpInfo += "\n";
        }

        if (
          status.orchestratorTools &&
          Object.keys(status.orchestratorTools).length > 0
        ) {
          mcpInfo += "**🔧 Orchestrator Tools:**\n";
          Object.entries(status.orchestratorTools).forEach(
            ([toolName, toolInfo]) => {
              mcpInfo += `✅ ${toolName}: ${
                toolInfo.description || toolInfo.name
              }\n`;
            }
          );
          mcpInfo += "\n";
        }

        if (status.aiSelection && status.aiSelection.available) {
          mcpInfo += "**🤖 AI Selection:**\n";
          mcpInfo += `Status: ${
            status.aiSelection.available ? "✅ Available" : "❌ Unavailable"
          }\n`;
          mcpInfo += `AI Decisions: ${status.aiSelection.aiDecisions || 0}\n`;
          mcpInfo += `Fallback Decisions: ${
            status.aiSelection.fallbackDecisions || 0
          }\n\n`;
        }
      } else {
        mcpInfo += "❌ Unable to fetch MCP status\n\n";
      }

      if (classifierStatus.success && classifierStatus.data) {
        const classifier = classifierStatus.data;
        mcpInfo += "**🤖 Query Classifier Status:**\n";
        mcpInfo += `Gemini AI: ${
          classifier.geminiAvailable ? "✅ Available" : "❌ Unavailable"
        }\n`;
        mcpInfo += `Model: ${classifier.model}\n\n`;

        mcpInfo += "**📊 Classification Approaches:**\n";
        mcpInfo +=
          "• MCP_TOOLS_ONLY - Direct tool responses (calculations, status checks)\n";
        mcpInfo +=
          "• HYBRID_SEARCH - Documentation-based responses (API guides, tutorials)\n";
        mcpInfo +=
          "• COMBINED - Both tools and documentation (complex queries)\n";
      }

      const mcpMessage = {
        id: Date.now(),
        text: mcpInfo,
        sender: "ai",
        timestamp: new Date(),
        isCommand: true,
      };

      setMessages((prev) => [...prev, mcpMessage]);
    } catch (error) {
      console.error("❌ Failed to fetch MCP status:", error);
      const errorMessage = {
        id: Date.now(),
        text: "❌ Failed to fetch MCP system status. Please try again.",
        sender: "ai",
        timestamp: new Date(),
        isCommand: true,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
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
    handleSampleCommand,
    handleMCPCommand,
  };
};
