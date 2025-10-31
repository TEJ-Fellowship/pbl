import React from "react";
import {
  Plus,
  MessageSquare,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Sidebar = ({
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onClearChat,
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${isOpen ? "fixed" : "hidden"} left-0 top-0 h-full ${
          collapsed ? "lg:w-16 w-64" : "w-64"
        } ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-200"
        } border-r z-50 flex flex-col lg:relative lg:flex lg:z-auto transition-all duration-300`}
      >
        {/* Header */}
        <div
          className={`p-3 border-b ${
            isDark ? "border-gray-800" : "border-gray-200"
          } space-y-3`}
        >
          {/* Collapse/Expand button - only on desktop (lg+) */}
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex w-full items-center ${
              collapsed ? "justify-center" : "gap-2 justify-between"
            } px-3 py-2 rounded-lg transition-colors border ${
              isDark
                ? "bg-gray-800/50 hover:bg-gray-800 text-gray-300 border-gray-700"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
            }`}
            title={collapsed ? "Open sidebar" : "Close sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <span className="text-sm font-medium">Close sidebar</span>
                <ChevronLeft className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Close button for mobile - above New chat button */}
          <button
            onClick={onClose}
            className={`lg:hidden w-full flex items-center justify-end px-3 py-2 rounded-lg transition-colors ${
              isDark
                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            }`}
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* New chat button */}
          <button
            onClick={onNewChat}
            className={`w-full flex items-center ${
              collapsed ? "justify-center" : "gap-2"
            } px-3 py-2 rounded-lg transition-colors border ${
              isDark
                ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-emerald-600 shadow-sm"
            }`}
            title={collapsed ? "New chat" : undefined}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">New chat</span>
            )}
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          <div className="space-y-1">
            {sessions.length === 0 && !collapsed ? (
              <div className="text-center py-8 px-4">
                <MessageSquare
                  className={`w-8 h-8 mx-auto mb-2 ${
                    isDark ? "text-gray-600" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  No conversations yet
                </p>
              </div>
            ) : sessions.length > 0 ? (
              sessions
                .sort(
                  (a, b) =>
                    new Date(b.lastActivity || 0) -
                    new Date(a.lastActivity || 0)
                )
                .map((session) => {
                  const isActive = session.id === currentSessionId;
                  const sessionName = session.id.split("_")[1];

                  return (
                    <div
                      key={session.id}
                      className={`group relative flex items-center ${
                        collapsed ? "justify-center" : "gap-2"
                      } p-2 rounded-lg cursor-pointer transition-colors ${
                        isActive
                          ? `${
                              isDark ? "bg-gray-800" : "bg-gray-100"
                            } border border-emerald-500/30`
                          : isDark
                          ? "hover:bg-gray-800/50"
                          : "hover:bg-gray-100/50"
                      }`}
                      onClick={() => onSelectSession(session.id)}
                      title={collapsed ? sessionName : undefined}
                    >
                      <MessageSquare
                        className={`w-4 h-4 flex-shrink-0 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      />
                      {!collapsed && (
                        <>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm truncate ${
                                isDark ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {sessionName}
                            </p>
                            {session.messageCount > 0 && (
                              <p
                                className={`text-xs ${
                                  isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                              >
                                {session.messageCount} messages
                              </p>
                            )}
                          </div>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          )}
                        </>
                      )}
                      {collapsed && isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-500" />
                      )}
                    </div>
                  );
                })
            ) : null}
          </div>
        </div>

        {/* Footer Actions */}
        {!collapsed && (
          <div
            className={`p-3 border-t ${
              isDark ? "border-gray-800" : "border-gray-200"
            }`}
          >
            {currentSessionId && (
              <button
                onClick={onClearChat}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isDark
                    ? "text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                    : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Clear conversation</span>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
