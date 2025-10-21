import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Send, Copy, Check, ThumbsUp, ThumbsDown, Menu, X } from "lucide-react";
import { renderMarkdown } from "./utils/markdown.js";
import ChatHistorySidebar from "./components/ChatHistorySidebar.jsx";
import "./App.css";

const API_BASE_URL = "http://localhost:3001/api";

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const [expandedSources, setExpandedSources] = useState({});
  const [copiedCode, setCopiedCode] = useState({});
  const [feedback, setFeedback] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingClarification, setPendingClarification] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load conversation history on mount
    loadConversationHistory();
  }, []);

  const loadConversationHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/history/${sessionId}`);
      if (response.data.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error("Error loading conversation history:", error);
    }
  };

  const handleSessionChange = async (newSessionId) => {
    setSessionId(newSessionId);
    setMessages([]); // Clear current messages
    setSidebarOpen(false); // Close sidebar
    setPendingClarification(null); // Clear any pending clarification
    // Load the new conversation history
    try {
      const response = await axios.get(
        `${API_BASE_URL}/history/${newSessionId}`
      );
      if (response.data.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error("Error loading conversation history:", error);
    }
  };

  const handleNewChat = () => {
    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setSessionId(newSessionId);
    setMessages([]);
    setSidebarOpen(false);
    setPendingClarification(null);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      let response;

      // Check if we have a pending clarification
      if (pendingClarification) {
        // Send clarification response
        response = await axios.post(`${API_BASE_URL}/clarify`, {
          clarificationResponse: currentMessage,
          originalQuestion: pendingClarification.originalQuestion,
          sessionId: sessionId,
        });
        setPendingClarification(null); // Clear pending clarification
      } else {
        // Send regular chat message
        response = await axios.post(`${API_BASE_URL}/chat`, {
          message: currentMessage,
          sessionId: sessionId,
        });
      }

      const assistantMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: response.data.answer,
        timestamp: new Date(),
        confidence: response.data.confidence,
        sources: response.data.sources || [],
        tokenUsage: response.data.tokenUsage,
        truncated: response.data.truncated,
        mcpTools: response.data.mcpTools || {},
        multiTurnContext: response.data.multiTurnContext || {},
        needsClarification: response.data.needsClarification || false,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Check if clarification is needed
      if (response.data.needsClarification) {
        setPendingClarification({
          originalQuestion: currentMessage,
          clarificationQuestion: response.data.answer,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content:
          "Sorry, I encountered an error while processing your message. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyCode = (code, messageId) => {
    navigator.clipboard.writeText(code);
    setCopiedCode((prev) => ({ ...prev, [messageId]: true }));
    setTimeout(() => {
      setCopiedCode((prev) => ({ ...prev, [messageId]: false }));
    }, 2000);
  };

  const handleFeedback = (messageId, isPositive) => {
    setFeedback((prev) => ({ ...prev, [messageId]: isPositive }));
    // Here you could send feedback to backend if needed
  };

  const toggleSources = (messageId) => {
    setExpandedSources((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const renderMessage = (message) => {
    const isUser = message.role === "user";
    const isError = message.isError;
    const isClarificationRequest = message.needsClarification;

    return (
      <div
        key={message.id}
        className={`message ${isUser ? "user" : "assistant"} ${
          isError ? "error" : ""
        }`}
      >
        <div className="message-content">
          {isClarificationRequest && (
            <div className="clarification-indicator">
              <span className="clarification-badge">Clarification Request</span>
            </div>
          )}

          <div
            className="message-text"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(message.content),
            }}
          />

          {/* Multi-turn context indicators */}
          {message.multiTurnContext && (
            <div className="multi-turn-context">
              {message.multiTurnContext.isFollowUp && (
                <span className="follow-up-indicator">
                  🔗 Follow-up detected
                </span>
              )}
              {message.multiTurnContext.turnCount > 1 && (
                <span className="turn-count">
                  Turn {message.multiTurnContext.turnCount}
                </span>
              )}
            </div>
          )}

          {/* Confidence and sources for assistant messages */}
          {!isUser && !isError && (
            <div className="message-meta">
              {message.confidence && (
                <div className="confidence">
                  <span
                    className={`confidence-badge confidence-${message.confidence.level
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {message.confidence.level} Confidence (
                    {message.confidence.score}%)
                  </span>
                </div>
              )}

              {message.sources && message.sources.length > 0 && (
                <div className="sources">
                  <button
                    className="sources-toggle"
                    onClick={() => toggleSources(message.id)}
                  >
                    {expandedSources[message.id]
                      ? "Hide Sources"
                      : `Show Sources (${message.sources.length})`}
                  </button>

                  {expandedSources[message.id] && (
                    <div className="sources-list">
                      {message.sources.map((source, index) => (
                        <div key={index} className="source-item">
                          <div className="source-header">
                            <span className="source-title">{source.title}</span>
                            <span className="source-score">
                              {(source.score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="source-category">
                            {source.category} • {source.searchType}
                          </div>
                          {source.url && source.url !== "N/A" && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="source-link"
                            >
                              View Source
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Feedback buttons */}
              <div className="feedback">
                <button
                  className={`feedback-btn ${
                    feedback[message.id] === true ? "active" : ""
                  }`}
                  onClick={() => handleFeedback(message.id, true)}
                  title="Helpful"
                >
                  <ThumbsUp size={16} />
                </button>
                <button
                  className={`feedback-btn ${
                    feedback[message.id] === false ? "active" : ""
                  }`}
                  onClick={() => handleFeedback(message.id, false)}
                  title="Not helpful"
                >
                  <ThumbsDown size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1>Shopify Merchant Support Agent</h1>
          <div className="session-info">Session: {sessionId.split("_")[1]}</div>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h2>Welcome to Shopify Merchant Support!</h2>
              <p>
                I'm here to help you with Shopify-related questions. Ask me
                about:
              </p>
              <ul>
                <li>Product and inventory management</li>
                <li>Order fulfillment and shipping</li>
                <li>Theme development and customization</li>
                <li>API integration and development</li>
                <li>App development and best practices</li>
              </ul>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="input-container">
          {/* Clarification hint */}
          {pendingClarification && (
            <div className="clarification-hint">
              <div className="clarification-hint-content">
                <span className="clarification-icon">💡</span>
                <span className="clarification-text">
                  Please provide clarification for: "
                  {pendingClarification.originalQuestion}"
                </span>
              </div>
            </div>
          )}

          <div className="input-wrapper">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                pendingClarification
                  ? "Provide your clarification..."
                  : "Ask me anything about Shopify..."
              }
              className="message-input"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="send-button"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentSessionId={sessionId}
        onSessionChange={handleSessionChange}
        onNewChat={handleNewChat}
      />
    </div>
  );
}

export default App;

