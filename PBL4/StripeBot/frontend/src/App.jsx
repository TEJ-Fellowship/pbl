import { useState } from "react";
import NavBar from "./components/NavBar";
import ChatInputBar from "./components/ChatInputBar";
import { sendPrompt } from "./services/chatApi";

const createMessage = (role, text) => ({
  id: crypto.randomUUID(),
  role,
  text,
  createdAt: new Date().toISOString(),
});

const App = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = async (userText) => {
    const cleanText = typeof userText === "string" ? userText.trim() : "";
    if (!cleanText || isLoading) return;

    setError("");
    setMessages((prev) => [...prev, createMessage("user", cleanText)]);
    setInputValue("");
    setIsLoading(true);

    try {
      const data = await sendPrompt(cleanText);
      setMessages((prev) => [...prev, createMessage("assistant", data.reply)]);
    } catch (err) {
      const message = err?.message || "Something went wrong.";
      setError(message);
      setMessages((prev) => [...prev, createMessage("assistant", message)]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NavBar />

      <div>
        {messages.map((msg) => (
          <p key={msg.id}>
            <strong>{msg.role}:</strong> {msg.text}
          </p>
        ))}
      </div>

      {error ? <p>{error}</p> : null}

      <ChatInputBar
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        isLoading={isLoading}
      />
    </>
  );
};

export default App;
