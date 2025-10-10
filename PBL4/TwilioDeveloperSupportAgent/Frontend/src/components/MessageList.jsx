import React from "react";
import { User, Bot, AlertCircle, Loader2 } from "lucide-react";
import ResponseFormatter from "./ResponseFormatter";

const MessageList = ({ messages, isLoading, messagesEndRef }) => {
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
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}
      >
        <div
          className={`flex max-w-[80%] ${
            isUser ? "flex-row-reverse" : "flex-row"
          } items-start space-x-3`}
        >
          {/* Avatar */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isUser
                ? "bg-blue-600 text-white"
                : isError
                ? "bg-red-500 text-white"
                : "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
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
            className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
          >
            <div
              className={`px-4 py-3 rounded-2xl ${
                isUser
                  ? "bg-blue-600 text-white rounded-br-md"
                  : isError
                  ? "bg-red-50 text-red-800 border border-red-200 rounded-bl-md"
                  : "bg-slate-50 text-slate-900 border border-slate-200 rounded-bl-md"
              }`}
            >
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              ) : isError ? (
                <p className="text-sm">{message.content}</p>
              ) : (
                <ResponseFormatter
                  content={message.content}
                  sources={message.sources}
                  metadata={message.metadata}
                />
              )}
            </div>

            {/* Timestamp */}
            <span className="text-xs text-slate-500 mt-1 px-1">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Welcome to Twilio Developer Support
          </h3>
          <p className="text-slate-600 max-w-md">
            Ask me anything about Twilio APIs, SMS, Voice, Video, WhatsApp, or
            any other Twilio services. I can help with code examples,
            troubleshooting, and best practices.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {[
              "How do I send an SMS in Node.js?",
              "What does error 30001 mean?",
              "How to set up webhooks?",
              "Voice API examples",
            ].map((suggestion) => (
              <span
                key={suggestion}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm hover:bg-slate-200 transition-colors cursor-pointer"
                onClick={() => {
                  // This will be handled by the parent component
                  const event = new CustomEvent("suggestionClick", {
                    detail: suggestion,
                  });
                  window.dispatchEvent(event);
                }}
              >
                {suggestion}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(renderMessage)}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                    <span className="text-sm text-slate-600">Thinking...</span>
                  </div>
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
