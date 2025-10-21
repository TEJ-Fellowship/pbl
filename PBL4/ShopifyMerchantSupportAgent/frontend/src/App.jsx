import { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Menu,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import axios from "axios";
import { parseMarkdown } from "./utils/markdown.js";
import ChatHistorySidebar from "./components/ChatHistorySidebar.jsx";
import "./App.css";

const API_BASE_URL = "http://localhost:3003/api";

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
    const currentInput = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      let response;

      // Check if this is a clarification response
      if (pendingClarification) {
        response = await axios.post(`${API_BASE_URL}/clarify`, {
          clarificationResponse: currentInput,
          originalQuestion: pendingClarification.originalQuestion,
          sessionId: sessionId,
        });
        setPendingClarification(null); // Clear pending clarification
      } else {
        response = await axios.post(`${API_BASE_URL}/chat`, {
          message: currentInput,
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
        needsClarification: response.data.needsClarification || false,
        multiTurnContext: response.data.multiTurnContext || {},
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If clarification is needed, store the pending clarification
      if (response.data.needsClarification) {
        setPendingClarification({
          originalQuestion: currentInput,
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

  const renderMessageContent = (content) => {
    // Split content by code blocks
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const code = part.slice(3, -3).trim();
        const language = code.split("\n")[0].match(/^(\w+)/)?.[1] || "";
        const actualCode = code.replace(/^\w+\n/, "");

        return (
          <div key={index} className="code-block">
            <div className="code-header">
              <span className="language">{language || "code"}</span>
              <button
                className="copy-button"
                onClick={() => copyCode(actualCode, `code_${index}`)}
              >
                {copiedCode[`code_${index}`] ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
            <SyntaxHighlighter
              language={language}
              style={tomorrow}
              customStyle={{
                margin: 0,
                borderRadius: "0 0 8px 8px",
                fontSize: "14px",
              }}
            >
              {actualCode}
            </SyntaxHighlighter>
          </div>
        );
      } else if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={index} className="inline-code">
            {part.slice(1, -1)}
          </code>
        );
      } else {
        return (
          <div
            key={index}
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(part) }}
          />
        );
      }
    });
  };

  const getConfidenceColor = (level) => {
    switch (level) {
      case "High":
        return "text-green-600 bg-green-100";
      case "Medium":
        return "text-yellow-600 bg-yellow-100";
      case "Low":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-content">
            <button
              className="menu-button"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <Bot className="header-icon" />
            <div>
              <h1>Shopify Merchant Support</h1>
              <p>AI-powered assistance for your Shopify store</p>
            </div>
          </div>
        </div>

        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-message">
              <Bot size={48} className="welcome-icon" />
              <h2>Welcome to Shopify Merchant Support!</h2>
              <p>
                Ask me anything about Shopify APIs, store management, or
                merchant tools.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-avatar">
                {message.role === "user" ? (
                  <User size={20} />
                ) : (
                  <Bot size={20} />
                )}
              </div>
              <div className="message-content">
                {message.needsClarification && (
                  <div className="clarification-indicator">
                    <span className="clarification-badge">
                      💡 Clarification Request
                    </span>
                  </div>
                )}
                <div className="message-text">
                  {renderMessageContent(message.content)}
                </div>

                {message.confidence && (
                  <div className="confidence-indicator">
                    <span
                      className={`confidence-badge ${getConfidenceColor(
                        message.confidence.level
                      )}`}
                    >
                      {message.confidence.level} Confidence (
                      {message.confidence.score}/100)
                    </span>
                    <div className="confidence-factors">
                      {message.confidence.factors.join(", ")}
                    </div>
                  </div>
                )}

                {message.sources && message.sources.length > 0 && (
                  <div className="sources-section">
                    <button
                      className="sources-toggle"
                      onClick={() => toggleSources(message.id)}
                    >
                      <span>Sources ({message.sources.length})</span>
                      {expandedSources[message.id] ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>

                    {expandedSources[message.id] && (
                      <div className="sources-list">
                        {message.sources.map((source) => (
                          <div key={source.id} className="source-item">
                            <div className="source-header">
                              <span className="source-title">
                                {source.title}
                              </span>
                              <span className="source-score">
                                Score: {source.score.toFixed(3)}
                              </span>
                            </div>
                            <div className="source-meta">
                              <span className="source-category">
                                {source.category}
                              </span>
                              <span className="source-type">
                                {source.searchType}
                              </span>
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

                {message.mcpTools &&
                  message.mcpTools.toolsUsed &&
                  message.mcpTools.toolsUsed.length > 0 && (
                    <div className="mcp-tools-section">
                      <div className="mcp-tools-header">
                        <span className="mcp-tools-title">
                          🔧 Tools Used: {message.mcpTools.toolsUsed.join(", ")}
                        </span>
                      </div>
                      {message.mcpTools.toolResults &&
                        Object.keys(message.mcpTools.toolResults).length >
                          0 && (
                          <div className="mcp-tools-results">
                            {Object.entries(message.mcpTools.toolResults).map(
                              ([toolName, result]) => (
                                <div key={toolName} className="tool-result">
                                  <div className="tool-name">{toolName}</div>
                                  {result.error ? (
                                    <div className="tool-error">
                                      Error: {result.error}
                                    </div>
                                  ) : (
                                    <div className="tool-calculations">
                                      {/* Calculator Results */}
                                      {result.calculations &&
                                        result.calculations.length > 0 && (
                                          <div className="calculations-list">
                                            {result.calculations.map(
                                              (calc, index) => (
                                                <div
                                                  key={index}
                                                  className="calculation-item"
                                                >
                                                  <code className="calculation-expression">
                                                    {calc.original}
                                                  </code>
                                                  <span className="calculation-result">
                                                    = {calc.formatted}
                                                  </span>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}

                                      {/* Shopify Status Results */}
                                      {result.status && (
                                        <div className="shopify-status-results">
                                          <div className="status-overview">
                                            <div className="status-indicator">
                                              <span className="status-emoji">
                                                {result.status.overallStatus ===
                                                "operational"
                                                  ? "🟢"
                                                  : result.status
                                                      .overallStatus === "minor"
                                                  ? "🟡"
                                                  : result.status
                                                      .overallStatus === "major"
                                                  ? "🟠"
                                                  : "🔴"}
                                              </span>
                                              <span className="status-text">
                                                {
                                                  result.status
                                                    .overallDescription
                                                }
                                              </span>
                                            </div>
                                          </div>

                                          {result.status.incidents &&
                                            result.status.incidents.length >
                                              0 && (
                                              <div className="status-incidents">
                                                <h4 className="status-section-title">
                                                  🚨 Active Issues (
                                                  {
                                                    result.status.incidents
                                                      .length
                                                  }
                                                  )
                                                </h4>
                                                {result.status.incidents.map(
                                                  (incident, index) => (
                                                    <div
                                                      key={incident.id}
                                                      className="status-incident"
                                                    >
                                                      <div className="incident-header">
                                                        <span className="incident-name">
                                                          {incident.name}
                                                        </span>
                                                        <span className="incident-impact">
                                                          {incident.impact ===
                                                          "critical"
                                                            ? "🔴"
                                                            : incident.impact ===
                                                              "major"
                                                            ? "🟠"
                                                            : incident.impact ===
                                                              "minor"
                                                            ? "🟡"
                                                            : "✅"}{" "}
                                                          {incident.impact}
                                                        </span>
                                                      </div>
                                                      <div className="incident-status">
                                                        Status:{" "}
                                                        {incident.status}
                                                      </div>
                                                      {incident.shortlink && (
                                                        <a
                                                          href={
                                                            incident.shortlink
                                                          }
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="incident-link"
                                                        >
                                                          View Details
                                                        </a>
                                                      )}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            )}

                                          {result.status.maintenance &&
                                            result.status.maintenance.length >
                                              0 && (
                                              <div className="status-maintenance">
                                                <h4 className="status-section-title">
                                                  🔧 Scheduled Maintenance (
                                                  {
                                                    result.status.maintenance
                                                      .length
                                                  }
                                                  )
                                                </h4>
                                                {result.status.maintenance.map(
                                                  (maintenance, index) => (
                                                    <div
                                                      key={maintenance.id}
                                                      className="status-maintenance-item"
                                                    >
                                                      <div className="maintenance-name">
                                                        {maintenance.name}
                                                      </div>
                                                      <div className="maintenance-schedule">
                                                        {new Date(
                                                          maintenance.scheduledFor
                                                        ).toLocaleString()}{" "}
                                                        -
                                                        {new Date(
                                                          maintenance.scheduledUntil
                                                        ).toLocaleString()}
                                                      </div>
                                                      {maintenance.shortlink && (
                                                        <a
                                                          href={
                                                            maintenance.shortlink
                                                          }
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="maintenance-link"
                                                        >
                                                          View Details
                                                        </a>
                                                      )}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            )}

                                          {result.status.components &&
                                            result.status.components.length >
                                              0 && (
                                              <div className="status-components">
                                                <h4 className="status-section-title">
                                                  📊 Service Components
                                                </h4>
                                                <div className="components-grid">
                                                  {result.status.components.map(
                                                    (component, index) => (
                                                      <div
                                                        key={component.id}
                                                        className="component-item"
                                                      >
                                                        <span className="component-name">
                                                          {component.name}
                                                        </span>
                                                        <span
                                                          className={`component-status status-${component.status}`}
                                                        >
                                                          {component.status ===
                                                          "operational"
                                                            ? "🟢"
                                                            : component.status ===
                                                              "degraded_performance"
                                                            ? "🟡"
                                                            : component.status ===
                                                              "partial_outage"
                                                            ? "🟠"
                                                            : "🔴"}{" "}
                                                          {component.status}
                                                        </span>
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                          <div className="status-footer">
                                            <small className="status-last-updated">
                                              Last updated:{" "}
                                              {new Date(
                                                result.status.lastUpdated
                                              ).toLocaleString()}
                                            </small>
                                            <a
                                              href="https://status.shopify.com"
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="status-page-link"
                                            >
                                              View Full Status Page
                                            </a>
                                          </div>
                                        </div>
                                      )}

                                      {/* Date/Time Results */}
                                      {result.operations &&
                                        result.operations.length > 0 && (
                                          <div className="datetime-operations">
                                            <h4 className="datetime-section-title">
                                              🕒 Time Operations
                                            </h4>
                                            {result.operations.map(
                                              (operation, index) => (
                                                <div
                                                  key={index}
                                                  className="datetime-operation"
                                                >
                                                  <div className="operation-type">
                                                    {operation.type
                                                      .replace(/_/g, " ")
                                                      .toUpperCase()}
                                                  </div>
                                                  <div className="operation-value">
                                                    {operation.formatted}
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}

                                      {result.calculations &&
                                        result.calculations.length > 0 && (
                                          <div className="datetime-calculations">
                                            <h4 className="datetime-section-title">
                                              📅 Time Calculations
                                            </h4>
                                            {result.calculations.map(
                                              (calculation, index) => (
                                                <div
                                                  key={index}
                                                  className="datetime-calculation"
                                                >
                                                  <div className="calculation-dates">
                                                    {calculation.date1} →{" "}
                                                    {calculation.date2}
                                                  </div>
                                                  <div className="calculation-result">
                                                    {calculation.formatted}
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}

                                      {/* Code Validator Results */}
                                      {result.validations &&
                                        result.validations.length > 0 && (
                                          <div className="code-validator-results">
                                            <h4 className="validator-section-title">
                                              🔍 Validation Results
                                            </h4>
                                            {result.validations.map(
                                              (validation, index) => (
                                                <div
                                                  key={index}
                                                  className="validation-item"
                                                >
                                                  <div className="validation-header">
                                                    <span className="validation-type">
                                                      {validation.type.toUpperCase()}
                                                    </span>
                                                    <span className="validation-value">
                                                      {validation.value}
                                                    </span>
                                                  </div>

                                                  {validation.validation
                                                    .errors &&
                                                    validation.validation.errors
                                                      .length > 0 && (
                                                      <div className="validation-errors">
                                                        <span className="error-label">
                                                          Errors:
                                                        </span>
                                                        {validation.validation.errors.join(
                                                          ", "
                                                        )}
                                                      </div>
                                                    )}

                                                  {validation.validation
                                                    .warnings &&
                                                    validation.validation
                                                      .warnings.length > 0 && (
                                                      <div className="validation-warnings">
                                                        <span className="warning-label">
                                                          Warnings:
                                                        </span>
                                                        {validation.validation.warnings.join(
                                                          ", "
                                                        )}
                                                      </div>
                                                    )}

                                                  {validation.validation
                                                    .suggestions &&
                                                    validation.validation
                                                      .suggestions.length >
                                                      0 && (
                                                      <div className="validation-suggestions">
                                                        <span className="suggestion-label">
                                                          Suggestions:
                                                        </span>
                                                        {validation.validation.suggestions.join(
                                                          ", "
                                                        )}
                                                      </div>
                                                    )}
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}

                                      {/* Web Search Results */}
                                      {result.results &&
                                        result.results.length > 0 && (
                                          <div className="web-search-sources">
                                            {result.results.map(
                                              (searchResult, index) => (
                                                <div
                                                  key={index}
                                                  className="web-search-source"
                                                >
                                                  <div className="web-search-source-title">
                                                    {searchResult.title}
                                                  </div>
                                                  <div className="web-search-source-content">
                                                    {searchResult.content}
                                                  </div>
                                                  <div className="web-search-source-meta">
                                                    <a
                                                      href={searchResult.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="web-search-source-url"
                                                    >
                                                      View Source
                                                    </a>
                                                    <span className="web-search-source-type">
                                                      {searchResult.source}
                                                    </span>
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}

                                      {result.summary && (
                                        <div className="tool-summary">
                                          {result.summary}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  )}

                {message.tokenUsage && (
                  <div className="token-usage">
                    <small>
                      Tokens: {message.tokenUsage.totalTokens}/
                      {message.tokenUsage.maxTokens || 6000}
                      {message.truncated && (
                        <span className="truncated"> (truncated)</span>
                      )}
                    </small>
                  </div>
                )}

                <div className="message-actions">
                  <div className="feedback-buttons">
                    <button
                      className={`feedback-btn ${
                        feedback[message.id] === true ? "active" : ""
                      }`}
                      onClick={() => handleFeedback(message.id, true)}
                      disabled={feedback[message.id] !== undefined}
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <button
                      className={`feedback-btn ${
                        feedback[message.id] === false ? "active" : ""
                      }`}
                      onClick={() => handleFeedback(message.id, false)}
                      disabled={feedback[message.id] !== undefined}
                    >
                      <ThumbsDown size={16} />
                    </button>
                  </div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          {pendingClarification && (
            <div className="clarification-hint">
              <div className="clarification-icon">💡</div>
              <div className="clarification-text">
                <strong>Please clarify:</strong>{" "}
                {pendingClarification.clarificationQuestion}
                <br />
                <small>
                  Your response will help me provide a more specific answer.
                </small>
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
                  ? "Please provide clarification..."
                  : "Ask a question about Shopify..."
              }
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
