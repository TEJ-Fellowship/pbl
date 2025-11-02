import React, { useState } from "react";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useChatManager } from "../hooks/useChatManager";

/**
 * Main ChatWindow component - orchestrates chat UI with sidebar and message display
 * Follows DRY principle by delegating logic to custom hooks and smaller components
 */
export default function ChatWindow() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    chatThreads,
    activeSessionId,
    messages,
    input,
    isTyping,
    isLoadingHistory,
    setInput,
    handleNewChat,
    loadChatThread,
    handleDeleteThread,
    handleSend,
  } = useChatManager();

  return (
    <div className="flex h-screen bg-[#343541] text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        chatThreads={chatThreads}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectThread={loadChatThread}
        onDeleteThread={handleDeleteThread}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {isLoadingHistory ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-400">Loading chat history...</div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <MessageList messages={messages} isTyping={isTyping} />

            {/* Input */}
            <ChatInput
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isTyping={isTyping}
            />
          </>
        )}
      </div>
    </div>
  );
}
