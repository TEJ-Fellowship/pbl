import { MessageSquare, Clock } from "lucide-react";

const FloatingChat = ({ onOpenChat, onOpenHistory }) => {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="pointer-events-auto fixed bottom-6 right-6 flex gap-3 z-50">
        <button
          title="Open Chat"
          onClick={onOpenChat}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-900/30 flex items-center justify-center hover:scale-105 transition-transform"
        >
          <MessageSquare size={22} />
        </button>
        <button
          title="Chat History"
          onClick={onOpenHistory}
          className="h-14 w-14 rounded-full border border-white/20 bg-white/10 backdrop-blur text-white shadow-md hover:bg-white/20 transition"
        >
          <Clock size={22} />
        </button>
      </div>
    </div>
  );
};

export default FloatingChat;


