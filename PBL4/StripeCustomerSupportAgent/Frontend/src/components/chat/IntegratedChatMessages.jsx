import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { renderMarkdown, hasMarkdown } from "../../utils/markdownRenderer";

const SourcePanel = ({ sources, isOpen, onToggle }) => {
  console.log(
    "🔍 SourcePanel - sources:",
    sources,
    "Type:",
    typeof sources,
    "Is Array:",
    Array.isArray(sources)
  );

  // Ensure sources is an array and has items
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    console.log("🔍 SourcePanel - No valid sources to display");
    return null;
  }

  return (
    <div className="mt-3">
      {/* Always visible header with toggle button */}
      <div className="flex items-center justify-between mb-2">
        {/* <h4 className="text-sm font-semibold text-gray-300">Sources</h4> */}
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">
            {isOpen ? "expand_less" : "expand_more"}
          </span>
        </button>
      </div>

      {/* Collapsible content */}
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        className="overflow-hidden"
      >
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="space-y-2">
            {sources.slice(0, 5).map((source, index) => (
              <div
                key={index}
                className="text-xs text-gray-400 border-b border-gray-700/50 pb-2 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-300">
                    {source.title ||
                      source.metadata?.title ||
                      `Source ${index + 1}`}
                  </span>
                  <span className="text-gray-500 bg-gray-700/50 px-2 py-1 rounded text-xs">
                    {(source.similarity || source.score || 0).toFixed(3)}
                  </span>
                </div>
                {(source.source || source.metadata?.source) && (
                  <div className="mb-1">
                    <a
                      href={source.source || source.metadata?.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline transition-colors break-all"
                      title="Open source link in new tab"
                    >
                      <span className="material-symbols-outlined text-sm mr-1 align-middle">
                        open_in_new
                      </span>
                      {source.source || source.metadata?.source}
                    </a>
                  </div>
                )}
                {source.category && (
                  <div className="text-gray-600 text-xs">
                    <span className="material-symbols-outlined text-xs mr-1 align-middle">
                      category
                    </span>
                    {source.category}
                  </div>
                )}
              </div>
            ))}
            {sources.length > 5 && (
              <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700/50">
                <span className="material-symbols-outlined text-sm mr-1 align-middle">
                  info
                </span>
                Showing top 5 of {sources.length} sources
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
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

const MCPToolsIndicator = ({ mcpToolsUsed, mcpConfidence, classification }) => {
  // Ensure mcpToolsUsed is an array and has items
  if (
    !mcpToolsUsed ||
    !Array.isArray(mcpToolsUsed) ||
    mcpToolsUsed.length === 0
  ) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 mt-2">
      <span className="text-xs text-gray-400">MCP Tools:</span>
      <div className="flex flex-wrap gap-1">
        {mcpToolsUsed.map((tool, index) => (
          <span
            key={index}
            className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded"
          >
            {tool}
          </span>
        ))}
      </div>
      {mcpConfidence && (
        <span className="text-xs text-purple-300">
          ({(mcpConfidence * 100).toFixed(0)}%)
        </span>
      )}
      {classification && (
        <span className="text-xs bg-yellow-600/20 text-yellow-300 px-2 py-1 rounded">
          {classification}
        </span>
      )}
    </div>
  );
};

const MessageBubble = ({ message }) => {
  // Open sources by default if there are sources available
  const [sourcesOpen, setSourcesOpen] = useState(
    message.sources && message.sources.length > 0
  );

  console.log(
    "🔍 MessageBubble - message.sources:",
    message.sources,
    "Type:",
    typeof message.sources,
    "Is Array:",
    Array.isArray(message.sources)
  );
  console.log("🔍 MessageBubble - sourcesOpen:", sourcesOpen);

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
            <MCPToolsIndicator
              mcpToolsUsed={message.mcpToolsUsed}
              mcpConfidence={message.mcpConfidence}
              classification={message.classification}
            />
            <SourcePanel
              sources={Array.isArray(message.sources) ? message.sources : []}
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

const IntegratedChatMessages = ({ messages, isTyping, messagesEndRef }) => {
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

export default IntegratedChatMessages;
