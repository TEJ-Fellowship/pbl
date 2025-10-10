import React, { useState, useEffect, useRef } from "react";
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
} from "./services/api";

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getConversationHistory(sessionId);
        if (history.length > 0) {
          setMessages(history);
        }
      } catch (error) {
        console.error("Failed to load conversation history:", error);
      }
    };
    loadHistory();
  }, [sessionId]);

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
        content: "Sorry, I encountered an error. Please try again.",
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
    } catch (error) {
      console.error("Failed to clear conversation:", error);
    }
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
                onClick={handleClearConversation}
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      </header>

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
