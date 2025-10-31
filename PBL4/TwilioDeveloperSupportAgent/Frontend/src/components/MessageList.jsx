import React, { useState, useEffect } from "react";
import { User, Bot, AlertCircle } from "lucide-react";
import ResponseFormatter from "./ResponseFormatter";
import TypingIndicator from "./TypingIndicator";

const MessageList = ({
  messages,
  isLoading,
  messagesEndRef,
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingMessageId, setStreamingMessageId] = useState(null);

  useEffect(() => {
    if (isLoading && messages.length > 0) {
      // Start streaming animation
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === "user") {
        setStreamingMessageId("streaming");
        setStreamingContent("");
      }
    } else {
      setStreamingMessageId(null);
      setStreamingContent("");
    }
  }, [isLoading, messages]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = (message) => {
    const isUser = message.type === "user";
    const isError = message.type === "error";

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 px-4`}
      >
        <div
          className={`flex max-w-[85%] lg:max-w-[70%] ${
            isUser ? "flex-row-reverse" : "flex-row"
          } items-start gap-3`}
        >
          {/* Avatar */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isUser
                ? isDark
                  ? "bg-gray-700 text-gray-200"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                : isError
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {isUser ? (
              <User className="w-4 h-4" />
            ) : isError ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>

          {/* Message Content */}
          <div
            className={`flex flex-col ${
              isUser ? "items-end" : "items-start"
            } flex-1 min-w-0`}
          >
            <div
              className={`rounded-2xl px-4 py-3 w-full overflow-hidden ${
                isUser
                  ? isDark
                    ? "bg-emerald-500/20 text-emerald-100 border border-emerald-500/30"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border border-emerald-600 shadow-sm"
                  : isError
                  ? "bg-red-500/10 text-red-300 border border-red-500/30"
                  : isDark
                  ? "bg-gray-800 text-gray-100 border border-gray-700"
                  : "bg-gray-50 text-gray-900 border border-gray-200"
              }`}
            >
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">
                  {message.content}
                </p>
              ) : isError ? (
                <p className="text-sm break-words overflow-wrap-anywhere">
                  {message.content}
                </p>
              ) : (
                <div className="w-full min-w-0 overflow-hidden">
                  <ResponseFormatter
                    content={message.content}
                    sources={message.sources}
                    metadata={message.metadata}
                    theme={theme}
                  />
                </div>
              )}
            </div>

            {/* Timestamp */}
            <span
              className={`text-xs mt-1.5 px-1 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${
              isDark
                ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30"
                : "bg-gradient-to-r from-emerald-400 to-cyan-400 border-emerald-400/50"
            }`}
          >
            <Bot
              className={`w-8 h-8 ${
                isDark ? "text-emerald-400" : "text-white"
              }`}
            />
          </div>
          <h3
            className={`text-xl font-semibold mb-2 ${
              isDark ? "text-gray-200" : "text-gray-900"
            }`}
          >
            Welcome to Twilio Developer Support
          </h3>
          <p
            className={`max-w-md mb-6 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Ask me anything about Twilio APIs, SMS, Voice, Video, WhatsApp, or
            any other Twilio services. I can help with code examples,
            troubleshooting, and best practices.
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-lg">
            {[
              "How do I send an SMS in Node.js?",
              "What does error 30001 mean?",
              "How to set up webhooks?",
              "Voice API examples",
            ].map((suggestion) => (
              <button
                key={suggestion}
                className={`px-4 py-2 rounded-full text-sm transition-colors border ${
                  isDark
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700 hover:border-emerald-500/30"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-400"
                }`}
                onClick={() => {
                  const event = new CustomEvent("suggestionClick", {
                    detail: suggestion,
                  });
                  window.dispatchEvent(event);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-4">
          {messages.map(renderMessage)}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start mb-4 px-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    isDark
                      ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30"
                      : "bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 border-emerald-400/50"
                  }`}
                >
                  <Bot
                    className={`w-4 h-4 ${
                      isDark ? "text-emerald-400" : "text-emerald-600"
                    }`}
                  />
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-gray-50 border-gray-200"
                  } border`}
                >
                  <TypingIndicator />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
