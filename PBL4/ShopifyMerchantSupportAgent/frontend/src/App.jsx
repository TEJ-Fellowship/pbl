import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Send,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  MessageSquare,
  Bot,
  User,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import SourceCitations from "./components/SourceCitations";
import LoadingDots from "./components/LoadingDots";

const API_BASE_URL = "http://localhost:3000/api";

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sources, setSources] = useState([]);
  const [showSources, setShowSources] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize session on component mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSession = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/session`);
      if (response.data.success) {
        setSessionId(response.data.data.sessionId);
        // Load existing conversation history
        loadConversationHistory(response.data.data.sessionId);
      }
    } catch (error) {
      console.error("Failed to initialize session:", error);
    }
  };

  const loadConversationHistory = async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/history/${sessionId}`);
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: inputMessage,
        sessionId: sessionId,
      });

      if (response.data.success) {
        const assistantMessage = {
          role: "assistant",
          content: response.data.data.response,
          timestamp: response.data.data.timestamp,
          sources: response.data.data.sources,
          contextStats: response.data.data.contextStats,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setSources(response.data.data.sources || []);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleFeedback = async (messageIndex, helpful) => {
    try {
      await axios.post(`${API_BASE_URL}/feedback`, {
        sessionId,
        messageIndex,
        feedback: { helpful },
      });

      // Update local state
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === messageIndex
            ? { ...msg, feedback: { helpful, timestamp: new Date() } }
            : msg
        )
      );
    } catch (error) {
      console.error("Failed to update feedback:", error);
    }
  };

  const clearConversation = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/chat/${sessionId}`);
      setMessages([]);
      setSources([]);
      setShowSources(false);
    } catch (error) {
      console.error("Failed to clear conversation:", error);
    }
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting for code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);

    return parts.map((part, index) => {
      if (index % 3 === 0) {
        // Regular text
        return <span key={index}>{part}</span>;
      } else if (index % 3 === 1) {
        // Language identifier
        return null;
      } else {
        // Code content
        const language = parts[index - 1] || "text";
        return (
          <div key={index} className="my-4">
            <SyntaxHighlighter
              language={language}
              style={tomorrow}
              className="rounded-lg"
              showLineNumbers={false}
            >
              {part}
            </SyntaxHighlighter>
          </div>
        );
      }
    });
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-shopify-500 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Shopify Support Agent
            </h1>
            <p className="text-sm text-gray-500">
              Powered by AI with conversation memory
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSources(!showSources)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Sources ({sources.length})
          </button>
          <button
            onClick={clearConversation}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 inline mr-1" />
            Clear
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">
                  Welcome to Shopify Support!
                </p>
                <p className="text-sm">
                  Ask me anything about Shopify development, APIs, or merchant
                  support.
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`message-bubble ${
                    message.role === "user"
                      ? "message-user"
                      : "message-assistant"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === "assistant" && (
                      <Bot className="w-5 h-5 mt-1 text-gray-500 flex-shrink-0" />
                    )}
                    {message.role === "user" && (
                      <User className="w-5 h-5 mt-1 text-white flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="prose prose-sm max-w-none">
                        {formatMessage(message.content)}
                      </div>

                      {message.role === "assistant" && !message.isError && (
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleFeedback(index, true)}
                              className={`feedback-button feedback-helpful ${
                                message.feedback?.helpful === true
                                  ? "bg-green-200"
                                  : ""
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3 inline mr-1" />
                              Helpful
                            </button>
                            <button
                              onClick={() => handleFeedback(index, false)}
                              className={`feedback-button feedback-not-helpful ${
                                message.feedback?.helpful === false
                                  ? "bg-red-200"
                                  : ""
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3 inline mr-1" />
                              Not helpful
                            </button>
                          </div>
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="message-bubble message-assistant">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-gray-500" />
                    <LoadingDots />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about Shopify..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows="1"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sources Panel */}
        {showSources && (
          <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <SourceCitations sources={sources} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
