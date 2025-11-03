import { X, Clock } from "lucide-react";
import { useEffect, useState } from "react";

const SESSIONS_KEY = "sh_sessions";

function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function buildConversations(map) {
  // For now we have a single session 'default'. Build a single entry with a title.
  const conversations = [];
  const keys = Object.keys(map);
  for (const key of keys) {
    const messages = map[key] || [];
    const firstUser = messages.find((m) => m.type === "user");
    const title = firstUser?.content?.slice(0, 40) || "New chat";
    const updatedAt = messages[messages.length - 1]?.timestamp || new Date().toISOString();
    conversations.push({ id: key, title, count: messages.length, updatedAt });
  }
  return conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

const HistorySidebar = ({ open, onClose, onSelect }) => {
  const [convos, setConvos] = useState([]);

  useEffect(() => {
    const data = loadSessions();
    setConvos(buildConversations(data));
    if (!open && document && document.activeElement instanceof HTMLElement) {
      // Ensure no hidden descendant retains focus when closing
      document.activeElement.blur();
    }
  }, [open]);

  return (
    <div className={`fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity ${open ? 'opacity-100' : 'opacity-0'} bg-black/50`}
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        className={`absolute right-0 top-0 h-full w-[320px] max-w-[85vw] bg-[#0b1020] border-l border-white/10 text-white transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-500/20 to-purple-500/20">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-300" />
            <p className="text-sm text-blue-300">Chat History</p>
          </div>
          <button
            className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-3 space-y-2 overflow-y-auto h-[calc(100%-48px)]">
          {convos.length === 0 ? (
            <p className="text-sm text-gray-400">No chat history yet.</p>
          ) : (
            convos.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect && onSelect(c.id)}
                className="w-full text-left rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors"
              >
                <div className="text-sm font-medium truncate">{c.title}</div>
                <div className="text-xs text-gray-400">{c.count} messages</div>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};

export default HistorySidebar;


