import { useState, useRef, useEffect } from "react";

export const useChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your Stripe.AI assistant. How can I help you with Stripe integration or billing questions today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      title: "Stripe Payment Integration",
      lastMessage: "How to integrate Stripe payments?",
      timestamp: new Date(),
      messageCount: 5,
    },
    {
      id: 2,
      title: "Webhook Configuration",
      lastMessage: "Explain webhook handling",
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      messageCount: 8,
    },
    {
      id: 3,
      title: "Subscription Billing",
      lastMessage: "Subscription billing setup",
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      messageCount: 12,
    },
  ]);
  const [currentChatId, setCurrentChatId] = useState(1);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        text: "I understand your question about Stripe integration. Let me provide you with a comprehensive answer based on the official documentation...",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      lastMessage: "Start a new conversation",
      timestamp: new Date(),
      messageCount: 0,
    };
    setChatHistory((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your Stripe.AI assistant. How can I help you with Stripe integration or billing questions today?",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  };

  const handleChatSelect = (chatId) => {
    setCurrentChatId(chatId);
    // In a real app, you would load the messages for this chat
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your Stripe.AI assistant. How can I help you with Stripe integration or billing questions today?",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return {
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
  };
};
