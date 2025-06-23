import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Trash2, Clock, Plus } from "lucide-react";

const ChatHistory = ({
  conversations,
  onSelectConversation,
  onDeleteConversation,
  activeConversationId,
  onNewChat,
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-gray-900 border-r border-gray-700 w-80 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-semibold flex items-center gap-2">
          <MessageSquare size={20} />
          Chat History
        </h3>
        <button
          onClick={onNewChat}
          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start a new chat to see it here</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <motion.div
              key={conversation._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                activeConversationId === conversation._id
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
              onClick={() => onSelectConversation(conversation._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">
                    {conversation.topic || "General Chat"}
                  </h4>
                  <div className="flex items-center gap-1 text-xs opacity-75">
                    <Clock size={12} />
                    {formatDate(conversation.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation._id);
                  }}
                  className="p-1 hover:bg-red-500 rounded opacity-50 hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
