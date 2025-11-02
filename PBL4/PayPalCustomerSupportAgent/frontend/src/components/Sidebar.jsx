import React from "react";
import { Plus, MessageSquare, Trash2, Menu, X } from "lucide-react";
import { formatDate } from "../utils/chatUtils";

export default function Sidebar({
  isOpen,
  onToggle,
  chatThreads,
  activeSessionId,
  onNewChat,
  onSelectThread,
  onDeleteThread,
}) {
  return (
    <>
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "w-64" : "w-0"
        } transition-all duration-300 bg-[#202123] overflow-hidden flex flex-col border-r border-white/10`}
      >
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-3 m-3 px-3 py-2.5 rounded-md border border-white/20 hover:bg-white/10 transition-colors text-white"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New Chat</span>
        </button>

        {/* Chat Threads List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
          {chatThreads
            .sort(
              (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
            )
            .map((thread) => (
              <div
                key={thread.sessionId}
                onClick={() => onSelectThread(thread.sessionId)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer hover:bg-white/10 transition-colors ${
                  activeSessionId === thread.sessionId ? "bg-white/10" : ""
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {thread.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(thread.lastMessageAt)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteThread(thread.sessionId);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-opacity"
                  aria-label="Delete chat"
                >
                  <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-20 p-2 bg-[#202123] rounded-md hover:bg-white/10 transition-colors text-white lg:hidden"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop Sidebar Toggle */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-20 p-2 bg-[#202123] rounded-md hover:bg-white/10 transition-colors text-white hidden lg:block"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
