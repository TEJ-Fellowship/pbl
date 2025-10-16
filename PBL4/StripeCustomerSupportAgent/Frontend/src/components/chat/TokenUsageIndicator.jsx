import React from "react";
import { motion } from "framer-motion";

const TokenUsageIndicator = ({
  currentTokens = 0,
  maxTokens = 4000,
  onNewSession = null,
}) => {
  const percentage = Math.min((currentTokens / maxTokens) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 95;

  // Color based on usage
  const getColor = () => {
    if (isAtLimit) return "text-red-500";
    if (isNearLimit) return "text-yellow-500";
    return "text-green-500";
  };

  const getBarColor = () => {
    if (isAtLimit) return "bg-red-500";
    if (isNearLimit) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <div className="flex items-center space-x-3 text-sm">
      {/* Token Usage Bar */}
      <div className="flex items-center space-x-2">
        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${getBarColor()} transition-colors duration-300`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <span className={`font-medium ${getColor()}`}>
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Token Count */}
      <div className="text-subtle-dark">
        <span className="font-mono">{currentTokens.toLocaleString()}</span>
        <span className="text-gray-500"> / </span>
        <span className="text-gray-500">{maxTokens.toLocaleString()}</span>
      </div>

      {/* New Session Button (when near limit) */}
      {isNearLimit && onNewSession && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewSession}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            isAtLimit
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
              : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30"
          }`}
          title={
            isAtLimit
              ? "Token limit reached! Start new chat"
              : "Approaching token limit - start new chat"
          }
        >
          {isAtLimit ? "New Chat" : "New Chat"}
        </motion.button>
      )}

      {/* Warning Icon */}
      {isNearLimit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${getColor()}`}
          title={isAtLimit ? "Token limit reached!" : "Approaching token limit"}
        >
          <span className="material-symbols-outlined text-sm">
            {isAtLimit ? "warning" : "info"}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default TokenUsageIndicator;
