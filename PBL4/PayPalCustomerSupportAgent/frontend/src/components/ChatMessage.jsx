import React from "react";
import { Bot, User, MessageSquare } from "lucide-react";
import {
  formatText,
  getSourceUrl,
  getSentimentEmoji,
} from "../utils/chatUtils";

export default function ChatMessage({ message }) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-purple-600" : "bg-green-600"
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block max-w-[85%] px-4 py-2 rounded-lg ${
            isUser
              ? "bg-purple-600 text-white"
              : message.isError
              ? "bg-red-900/50 text-red-200"
              : "bg-[#444654] text-gray-100"
          }`}
          dangerouslySetInnerHTML={{ __html: formatText(message.text) }}
        />

        {/* Sentiment & Confidence */}
        {message.sentiment && message.confidence && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <span>{getSentimentEmoji(message.sentiment)}</span>
            <span className="uppercase">{message.sentiment}</span>
            <span>•</span>
            <span>{message.confidence}% confidence</span>
          </div>
        )}

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.citations.map((citation, i) => {
              const sourceName =
                typeof citation === "string"
                  ? citation
                  : citation.source || citation.label || `Source ${i + 1}`;
              const sourceUrl = getSourceUrl(sourceName);

              return (
                <div key={i} className="text-xs">
                  {sourceUrl ? (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {sourceName}
                    </a>
                  ) : (
                    <span className="text-blue-400">{sourceName}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        {message.disclaimer && message.confidence < 40 && (
          <div className="mt-2 text-xs text-amber-200 bg-amber-500/20 border border-amber-500/30 rounded px-2 py-1">
            💡 {message.disclaimer}
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-1 text-xs text-gray-500">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
