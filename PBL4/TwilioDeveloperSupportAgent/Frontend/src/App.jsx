import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, User, Copy, Check, Loader2, Sparkles } from "lucide-react";
import ChatContainer from "./components/ChatContainer";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import CodeEditor from "./components/CodeEditor";
import ResponseFormatter from "./components/ResponseFormatter";
import {
  sendMessage,
  getConversationHistory,
  clearConversation,
  listSessions,
} from "./services/api";

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const [showSessionManager, setShowSessionManager] = useState(false);
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

  // Load sessions when session manager opens
  useEffect(() => {
    if (showSessionManager) {
      loadSessions();
    }
  }, [showSessionManager, loadSessions]);

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
      // Reload sessions list if manager is open
      if (showSessionManager) {
        await loadSessions();
      }
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
    setShowSessionManager(false);
  };

  const handleSwitchSession = (newSessionId) => {
    setSessionId(newSessionId);
    setShowSessionManager(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Twilio Developer Support
                </h1>
                <p className="text-sm text-slate-600">
                  AI-powered assistance for Twilio APIs
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-500">
                Session: {sessionId.split("_")[1]}
              </div>
              <button
                onClick={() => setShowSessionManager(!showSessionManager)}
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Manage Sessions"
              >
                Sessions ({sessions.length})
              </button>
              <button
                onClick={handleClearConversation}
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Session Manager Modal */}
      {showSessionManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Session Manager
              </h2>
              <button
                onClick={() => setShowSessionManager(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Total Sessions: {sessions.length}
                </p>
                <button
                  onClick={handleCreateNewSession}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  + New Session
                </button>
              </div>
              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No sessions found. Create a new session to start chatting!
                  </p>
                ) : (
                  sessions
                    .sort(
                      (a, b) =>
                        new Date(b.lastActivity || 0) -
                        new Date(a.lastActivity || 0)
                    )
                    .map((session) => (
                      <div
                        key={session.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          session.id === sessionId
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                        onClick={() => handleSwitchSession(session.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-slate-900">
                                {session.id.split("_")[1]}
                              </span>
                              {session.id === sessionId && (
                                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {session.messageCount} messages
                              {session.preferences?.language && (
                                <> • {session.preferences.language}</>
                              )}
                              {session.preferences?.api && (
                                <> • {session.preferences.api.toUpperCase()}</>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              Last activity:{" "}
                              {session.lastActivity
                                ? new Date(
                                    session.lastActivity
                                  ).toLocaleString()
                                : "Never"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Interface */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <ChatContainer>
          <MessageList
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
          />
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </ChatContainer>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-slate-600">
            <p>Powered by Twilio APIs • Built with React & Tailwind CSS</p>
            <p className="mt-1">
              Ask questions about SMS, Voice, Video, WhatsApp, and more!
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
