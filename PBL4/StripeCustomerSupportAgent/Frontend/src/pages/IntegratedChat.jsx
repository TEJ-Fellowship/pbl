import React from "react";
import { useIntegratedChat } from "../hooks/useIntegratedChat";
import IntegratedChatMessages from "../components/chat/IntegratedChatMessages";
import ChatInput from "../components/chat/ChatInput";
import ChatHeader from "../components/chat/ChatHeader";
import ChatHistory from "../components/chat/ChatHistory";
import TokenUsageIndicator from "../components/chat/TokenUsageIndicator";

const IntegratedChat = () => {
  const {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    chatHistory,
    currentSessionId,
    messagesEndRef,
    error,
    tokenUsage,
    handleSendMessage,
    handleNewChat,
    handleChatSelect,
    handleDeleteChat,
    handleTokenLimitReached,
    handleKeyPress,
    clearError,
  } = useIntegratedChat();

  return (
    <div className="fixed left-[15%] right-0 h-screen flex">
      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-900/90 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-red-400">
                error
              </span>
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-200 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col bg-surface-dark">
        <ChatHeader
          currentTokens={tokenUsage.currentTokens}
          maxTokens={tokenUsage.maxTokens}
          onNewSession={handleTokenLimitReached}
        />

        <IntegratedChatMessages
          messages={messages}
          isTyping={isTyping}
          messagesEndRef={messagesEndRef}
        />
        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSendMessage={handleSendMessage}
          handleKeyPress={handleKeyPress}
        />
      </div>

      {/* Chat History Sidebar */}
      <ChatHistory
        chatHistory={chatHistory}
        currentSessionId={currentSessionId}
        handleNewChat={handleNewChat}
        handleChatSelect={handleChatSelect}
        handleDeleteChat={handleDeleteChat}
      />
    </div>
  );
};

export default IntegratedChat;
