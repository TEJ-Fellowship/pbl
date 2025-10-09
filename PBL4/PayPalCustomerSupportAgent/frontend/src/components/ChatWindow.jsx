import { useState } from "react";
import axios from "axios";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const newMessage = { text, sender: "user" };
    setMessages((prev) => [...prev, newMessage]);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/query", {
        question: text,
        sessionId,
      });
      setMessages((prev) => [
        ...prev,
        {
          text: res.data.answer,
          sender: "bot",
          sentiment: res.data.sentiment?.sentiment,
          citations: res.data.citations,
          confidence: res.data.confidence,
          disclaimer: res.data.disclaimer,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { text: "⚠️ Sorry, something went wrong.", sender: "bot" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-lightBlue">
      <div className="bg-paypalBlue text-white py-3 px-6 text-xl font-semibold shadow-md">
        💬PayPal Support Agent
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-slate-100">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span className="inline-flex h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
            <span className="inline-flex h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
            <span className="inline-flex h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
            <span className="ml-1">Typing…</span>
          </div>
        )}
      </div>

      <InputBar onSend={sendMessage} />
    </div>
  );
};

export default ChatWindow;
