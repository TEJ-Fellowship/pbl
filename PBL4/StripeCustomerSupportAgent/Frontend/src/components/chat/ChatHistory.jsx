import React, { useState } from "react";
import { motion } from "framer-motion";
import DeleteConfirmModal from "./DeleteConfirmModal";

const ChatHistory = ({
  chatHistory,
  isLoadingSessions,
  currentSessionId,
  handleNewChat,
  handleChatSelect,
  handleDeleteChat,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    chatId: null,
    chatTitle: "",
  });
  const [editingTitle, setEditingTitle] = useState({
    chatId: null,
    newTitle: "",
  });

  const handleDeleteClick = (e, chatId, chatTitle) => {
    e.stopPropagation(); // Prevent chat selection
    setDeleteModal({
      isOpen: true,
      chatId,
      chatTitle,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.chatId && handleDeleteChat) {
      handleDeleteChat(deleteModal.chatId);
    }
    setDeleteModal({
      isOpen: false,
      chatId: null,
      chatTitle: "",
    });
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      chatId: null,
      chatTitle: "",
    });
  };

  const handleEditTitle = (e, chatId, currentTitle) => {
    e.stopPropagation(); // Prevent chat selection
    setEditingTitle({
      chatId,
      newTitle: currentTitle,
    });
  };

  const handleTitleChange = (e) => {
    setEditingTitle((prev) => ({
      ...prev,
      newTitle: e.target.value,
    }));
  };

  const handleTitleSave = () => {
    if (editingTitle.newTitle.trim()) {
      // Here you would typically call an API to update the title
      // For now, we'll just close the edit mode
      console.log(
        `Updating title for chat ${editingTitle.chatId} to: ${editingTitle.newTitle}`
      );
    }
    setEditingTitle({
      chatId: null,
      newTitle: "",
    });
  };

  const handleTitleCancel = () => {
    setEditingTitle({
      chatId: null,
      newTitle: "",
    });
  };

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-1/4 max-w-sm"
      } bg-black/20 backdrop-blur-sm border-r border-gray-800/50 flex flex-col transition-all duration-300`}
    >
      {/* Chat History Header */}
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-xl font-semibold">Chat History</h2>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-700 text-subtle-dark hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">
              {isCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </motion.button>
        </div>
        {!isCollapsed && (
          <div className="relative mt-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search history..."
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text-dark placeholder-gray-400 transition-all"
            />
          </div>
        )}
      </div>

      {/* Chat History List */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto chat-container">
          <div className="p-4 space-y-2">
            {isLoadingSessions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Loading sessions...</p>
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-gray-500 mb-2">
                  chat_bubble_outline
                </span>
                <p className="text-gray-400 text-sm">No chat history yet</p>
                <p className="text-gray-500 text-xs mt-1">
                  Start a new conversation
                </p>
              </div>
            ) : (
              chatHistory.map((chat) => {
                // Debug: Log chat object to see its structure
                console.log("Chat object:", chat);
                return (
                  <motion.div
                    key={chat.id}
                    whileHover={{ scale: 1.02 }}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                      currentSessionId === chat.sessionId
                        ? "bg-surface-dark-secondary border border-primary/50"
                        : "hover:bg-surface-dark-secondary/50"
                    }`}
                  >
                    {/* Chat Content */}
                    <div onClick={() => handleChatSelect(chat.id)}>
                      {editingTitle.chatId === chat.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingTitle.newTitle}
                            onChange={handleTitleChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                            placeholder="Enter chat title..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleTitleSave();
                              if (e.key === "Escape") handleTitleCancel();
                            }}
                          />
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTitleSave();
                              }}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTitleCancel();
                              }}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="font-semibold text-sm truncate pr-16">
                          {chat.title}
                        </p>
                      )}
                      <p className="text-xs text-subtle-dark truncate">
                        {chat.lastMessage}
                      </p>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {chat.timestamp
                          ? new Date(chat.timestamp).toLocaleDateString()
                          : "Unknown date"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleEditTitle(e, chat.id, chat.title)}
                        className="p-1 rounded-md hover:bg-blue-500/20 text-blue-400 hover:text-blue-300"
                        title="Edit title"
                      >
                        <span className="material-symbols-outlined text-sm">
                          edit
                        </span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) =>
                          handleDeleteClick(e, chat.id, chat.title)
                        }
                        className="p-1 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-300"
                        title="Delete chat"
                      >
                        <span className="material-symbols-outlined text-sm">
                          delete
                        </span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Collapsed State - Show only icons */}
      {isCollapsed && (
        <div className="flex-1 overflow-y-auto chat-container">
          <div className="p-2 space-y-2">
            {chatHistory.slice(0, 5).map((chat) => (
              <motion.div
                key={chat.id}
                whileHover={{ scale: 1.1 }}
                onClick={() => handleChatSelect(chat.id)}
                className={`p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center ${
                  currentSessionId === chat.sessionId
                    ? "bg-primary/20 border border-primary/50"
                    : "hover:bg-surface-dark-secondary/50"
                }`}
                title={chat.title}
              >
                <span className="material-symbols-outlined text-sm">
                  {chat.sessionId === currentSessionId
                    ? "chat"
                    : "chat_bubble_outline"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Chat History Footer */}
      <div className="p-4 border-t border-gray-800/50">
        {isCollapsed ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewChat}
            className="w-full p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors flex items-center justify-center"
            title="New Chat"
          >
            <span className="material-symbols-outlined">add</span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewChat}
            className="w-full py-2 px-4 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors flex items-center justify-center space-x-2"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Chat</span>
          </motion.button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        chatTitle={deleteModal.chatTitle}
      />
    </div>
  );
};

export default ChatHistory;
