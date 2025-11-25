import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { renderMarkdown, hasMarkdown } from "../../utils/markdownRenderer";

const SourcePanel = ({ sources, isOpen, onToggle }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <motion.div
      initial={false}
      animate={{ height: isOpen ? "auto" : 0 }}
      className="overflow-hidden"
    >
      <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-300">Sources</h4>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              {isOpen ? "expand_less" : "expand_more"}
            </span>
          </button>
        </div>
        {isOpen && (
          <div className="space-y-2">
            {sources.map((source, index) => (
              <div key={index} className="text-xs text-gray-400">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {source.title ||
                      source.metadata?.title ||
                      `Source ${index + 1}`}
                  </span>
                  <span className="text-gray-500">
                    {(source.similarity || source.score || 0).toFixed(3)}
                  </span>
                </div>
                {(source.source || source.metadata?.source) && (
                  <div className="text-gray-500 truncate">
                    {source.source || source.metadata?.source}
                  </div>
                )}
                {source.category && (
                  <div className="text-gray-600 text-xs">
                    Category: {source.category}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ConfidenceIndicator = ({ confidence }) => {
  if (!confidence) return null;

  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return "text-green-400";
    if (conf >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  const getConfidenceText = (conf) => {
    if (conf >= 0.8) return "High";
    if (conf >= 0.6) return "Medium";
    return "Low";
  };

  return (
    <div className="flex items-center space-x-2 mt-2">
      <span className="text-xs text-gray-400">Confidence:</span>
      <span className={`text-xs font-medium ${getConfidenceColor(confidence)}`}>
        {getConfidenceText(confidence)} ({(confidence * 100).toFixed(0)}%)
      </span>
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start space-x-4 w-full ${
        message.sender === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {message.sender === "ai" && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-primary mt-1">
          <span className="material-symbols-outlined text-lg text-white">
            auto_awesome
          </span>
        </div>
      )}

      <div
        className={`p-5 rounded-lg ${
          message.sender === "user"
            ? "bg-blue-600/80 text-white rounded-tr-none max-w-3xl"
            : message.isError
            ? "bg-red-900/20 border border-red-500/30 rounded-tl-none w-full"
            : "bg-gray-800/30 border border-gray-700/30 rounded-tl-none w-full"
        }`}
      >
        {/* removed assistant label */}
        <div className="text-text-dark leading-relaxed overflow-hidden">
          {hasMarkdown(message.text) ? (
            <div
              className="prose prose-invert prose-sm max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
            />
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {message.text}
            </div>
          )}
        </div>

        {message.sender === "ai" && !message.isError && (
          <>
            <ConfidenceIndicator confidence={message.confidence} />
            <SourcePanel
              sources={message.sources}
              isOpen={sourcesOpen}
              onToggle={() => setSourcesOpen(!sourcesOpen)}
            />
          </>
        )}
      </div>

      {message.sender === "user" && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-700 mt-1">
          <span className="material-symbols-outlined text-lg text-white">
            person
          </span>
        </div>
      )}
    </motion.div>
  );
};

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start space-x-4 w-full justify-start"
  >
    <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center mt-1">
      <span className="material-symbols-outlined text-lg text-white">
        auto_awesome
      </span>
    </div>
    <div className="bg-gray-800/30 border border-gray-700/30 p-5 rounded-lg rounded-tl-none w-full">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  </motion.div>
);

const ChatMessages = ({ messages, isTyping, messagesEndRef }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 chat-container">
      <div className="max-w-none w-full">
        <AnimatePresence>
          {messages.map((message) => (
            <div key={message.id} className="mb-8">
              <MessageBubble message={message} />
            </div>
          ))}
          {isTyping && (
            <div className="mb-8">
              <TypingIndicator />
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
