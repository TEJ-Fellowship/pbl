import React from "react";
import { useChat } from "../hooks/useChat";
import ChatHeader from "../components/chat/ChatHeader";
import ChatMessages from "../components/chat/ChatMessages";
import ChatInput from "../components/chat/ChatInput";
import ChatHistory from "../components/chat/ChatHistory";

const Chat = () => {
  const {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    chatHistory,
    currentChatId,
    messagesEndRef,
    handleSendMessage,
    handleNewChat,
    handleChatSelect,
    handleKeyPress,
  } = useChat();

  return (
    <div className="fixed left-[15%] right-0 h-screen flex">
      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col bg-surface-dark">
        <ChatHeader />
        <ChatMessages
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
        currentChatId={currentChatId}
        handleNewChat={handleNewChat}
        handleChatSelect={handleChatSelect}
      />
    </div>
  );
};

export default Chat;
