import React, { useState, useEffect, useRef, useCallback } from "react";
import { Menu, Moon, Sun, Loader2, Sparkles } from "lucide-react";
import ChatContainer from "./components/ChatContainer";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import Sidebar from "./components/Sidebar";
import { useTheme } from "./contexts/ThemeContext";
import {
  sendMessage,
  getConversationHistory,
  clearConversation,
  listSessions,
} from "./services/api";

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // Show sidebar on desktop, hide on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return window.innerWidth >= 1024; // lg breakpoint
  });
  // Collapsed state for sidebar (stored in localStorage) - only applies to desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Only load collapsed state if we're on desktop
    if (window.innerWidth >= 1024) {
      const stored = localStorage.getItem("twilio_sidebar_collapsed");
      return stored === "true";
    }
    return false; // Always full width on mobile
  });
  const { theme, toggleTheme } = useTheme();

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("twilio_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Initialize sessionId from localStorage or create new one
  const [sessionId, setSessionId] = useState(() => {
    const stored = localStorage.getItem("twilio_chat_session_id");
    if (stored) {
      return stored;
    }
    const newId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    localStorage.setItem("twilio_chat_session_id", newId);
    return newId;
  });

  const [sessions, setSessions] = useState([]);
  const messagesEndRef = useRef(null);

  // Update localStorage when sessionId changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("twilio_chat_session_id", sessionId);
    }
  }, [sessionId]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history on mount and when sessionId changes
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getConversationHistory(sessionId);
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error("Failed to load conversation history:", error);
        setMessages([]);
      }
    };
    loadHistory();
  }, [sessionId]);

  // Load sessions list
  const loadSessions = useCallback(async () => {
    try {
      const allSessions = await listSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  }, []);

  // Load sessions on mount and periodically
  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [loadSessions]);

  const handleSendMessage = async (content) => {
    if (!content.trim() || isLoading) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      type: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendMessage(content, sessionId);

      const assistantMessage = {
        id: `assistant_${Date.now()}`,
        type: "assistant",
        content: response.answer,
        sources: response.sources || [],
        metadata: response.metadata || {},
        timestamp: response.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      loadSessions(); // Refresh sessions list
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: `error_${Date.now()}`,
        type: "error",
        content:
          error.message || "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = async () => {
    try {
      await clearConversation(sessionId);
      setMessages([]);
      await loadSessions();
    } catch (error) {
      console.error("Failed to clear conversation:", error);
    }
  };

  const handleCreateNewSession = () => {
    const newId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setSessionId(newId);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleSwitchSession = (newSessionId) => {
    setSessionId(newSessionId);
    setSidebarOpen(false);
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
      } ${theme}`}
    >
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          sessions={sessions}
          currentSessionId={sessionId}
          onNewChat={handleCreateNewSession}
          onSelectSession={handleSwitchSession}
          onClearChat={handleClearConversation}
          theme={theme}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header
            className={`${
              isDark
                ? "bg-gray-900 border-gray-800"
                : "bg-white border-gray-200"
            } border-b px-4 py-3 flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                } rounded-lg transition-colors lg:hidden`}
              >
                <Menu
                  className={`w-5 h-5 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1
                    className={`text-lg font-semibold ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Twilio Support
                  </h1>
                  <p
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    AI-powered assistance
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 ${
                isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
              } rounded-lg transition-colors`}
              title="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-emerald-400" />
              ) : (
                <Moon className="w-5 h-5 text-cyan-400" />
              )}
            </button>
          </header>

          {/* Chat Area */}
          <main
            className={`flex-1 overflow-hidden ${
              isDark ? "bg-gray-900" : "bg-white"
            }`}
          >
            <ChatContainer theme={theme}>
              <MessageList
                messages={messages}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
                theme={theme}
              />
              <MessageInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                theme={theme}
              />
            </ChatContainer>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
