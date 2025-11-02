import { useState, useEffect, useCallback, useRef } from "react";
import {
  getChatThreads,
  saveChatThreads,
  createChatThread,
  updateChatThread,
  deleteChatThread as deleteThread,
  convertHistoryToMessages,
} from "../utils/chatUtils";
import { getChatHistory, sendQuery } from "../utils/api";

/**
 * Custom hook for managing chat threads, messages, and session state
 * Follows DRY principle by centralizing chat management logic
 */
export function useChatManager() {
  const [chatThreads, setChatThreads] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Track if initial load has happened
  const hasInitialized = useRef(false);
  // Track which sessionId is currently being loaded to prevent duplicate requests
  const loadingSessionIdRef = useRef(null);

  // Create a new chat thread
  const handleNewChat = useCallback(() => {
    const newThread = createChatThread();
    setChatThreads((prev) => [newThread, ...prev]);
    setActiveSessionId(newThread.sessionId);
    setMessages([
      {
        id: 1,
        sender: "bot",
        text: "Hey there! 👋 I'm your PayPal AI Assistant. Ready to help you with anything - from transactions to account security. What's on your mind?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Load a chat thread and its history
  const loadChatThread = useCallback(
    async (sessionId) => {
      // Validate sessionId format
      if (!sessionId || !sessionId.trim() || !sessionId.startsWith("chat_")) {
        console.error("Invalid sessionId:", sessionId);
        return;
      }

      // Prevent duplicate requests for the same sessionId
      if (
        sessionId === activeSessionId ||
        loadingSessionIdRef.current === sessionId
      ) {
        return;
      }

      loadingSessionIdRef.current = sessionId;
      setIsLoadingHistory(true);
      setActiveSessionId(sessionId);

      try {
        const data = await getChatHistory(sessionId);
        if (data.history && data.history.length > 0) {
          const historyMessages = convertHistoryToMessages(data.history);
          setMessages(historyMessages);

          // Update thread title from first user message
          const firstUserMessage = data.history.find(
            (msg) => msg.role === "user"
          );
          if (firstUserMessage) {
            const title = firstUserMessage.content.slice(0, 50);
            // Update in state and localStorage (updateChatThread already saves to localStorage)
            setChatThreads((prev) => {
              const updated = prev.map((thread) =>
                thread.sessionId === sessionId
                  ? {
                      ...thread,
                      title,
                      lastMessageAt:
                        thread.lastMessageAt || new Date().toISOString(),
                    }
                  : thread
              );
              // updateChatThread will also update localStorage, so sync it here
              updateChatThread(sessionId, { title });
              return updated;
            });
          }
        } else {
          // No history, show welcome message
          setMessages([
            {
              id: 1,
              sender: "bot",
              text: "Hey there! 👋 I'm your PayPal AI Assistant. Ready to help you with anything - from transactions to account security. What's on your mind?",
              timestamp: new Date(),
            },
          ]);
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
        setMessages([
          {
            id: 1,
            sender: "bot",
            text: "Hey there! 👋 I'm your PayPal AI Assistant. Ready to help you with anything - from transactions to account security. What's on your mind?",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoadingHistory(false);
        // Clear loading ref only if this request is still the active one
        if (loadingSessionIdRef.current === sessionId) {
          loadingSessionIdRef.current = null;
        }
      }
    },
    [activeSessionId]
  );

  // Load chat threads from localStorage on mount (only once)
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) return;

    const allThreads = getChatThreads();
    // Filter out invalid threads (missing sessionId or wrong format)
    const threads = allThreads.filter((thread) => {
      return (
        thread.sessionId &&
        thread.sessionId.trim() &&
        thread.sessionId.startsWith("chat_")
      );
    });

    // Clean up invalid threads from localStorage if any were filtered
    if (threads.length !== allThreads.length) {
      saveChatThreads(threads);
    }

    setChatThreads(threads);
    hasInitialized.current = true;

    if (threads.length > 0) {
      // Sort threads by lastMessageAt, with fallback for identical timestamps
      const sortedThreads = [...threads].sort((a, b) => {
        const timeA = new Date(a.lastMessageAt || 0).getTime();
        const timeB = new Date(b.lastMessageAt || 0).getTime();

        // If timestamps are identical (rare), maintain creation order
        if (timeA === timeB) {
          // Use index as fallback to maintain creation order
          const indexA = threads.indexOf(a);
          const indexB = threads.indexOf(b);
          return indexA - indexB;
        }

        return timeB - timeA; // Most recent first
      });

      // Load most recent thread (first in sorted array)
      loadChatThread(sortedThreads[0].sessionId);
    } else {
      // Create first chat thread
      handleNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Save chat threads to localStorage whenever it changes
  // Debounce to avoid multiple saves during rapid updates
  useEffect(() => {
    if (chatThreads.length > 0) {
      const timeoutId = setTimeout(() => {
        saveChatThreads(chatThreads);
      }, 100); // Small delay to batch rapid updates

      return () => clearTimeout(timeoutId);
    }
  }, [chatThreads]);

  // Delete a chat thread
  const handleDeleteThread = useCallback(
    (sessionId) => {
      const updatedThreads = deleteThread(sessionId);
      setChatThreads(updatedThreads);

      // If deleted thread was active, switch to another or create new
      if (activeSessionId === sessionId) {
        if (updatedThreads.length > 0) {
          loadChatThread(updatedThreads[0].sessionId);
        } else {
          handleNewChat();
        }
      }
    },
    [activeSessionId, loadChatThread, handleNewChat]
  );

  // Send a message
  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeSessionId || isTyping) return;

    const currentInput = input;
    const currentMessages = messages;

    const userMessage = {
      id: currentMessages.length + 1,
      sender: "user",
      text: currentInput,
      timestamp: new Date(),
    };

    // Update thread title if this is the first user message
    const isFirstUserMessage =
      currentMessages.filter((m) => m.sender === "user").length === 0;
    if (isFirstUserMessage) {
      const title = currentInput.slice(0, 50);
      // Update in state and localStorage (updateChatThread saves to localStorage)
      updateChatThread(activeSessionId, { title });
      setChatThreads((prev) =>
        prev.map((thread) =>
          thread.sessionId === activeSessionId ? { ...thread, title } : thread
        )
      );
    }

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const data = await sendQuery(currentInput, activeSessionId);

      const botMessage = {
        id: currentMessages.length + 2,
        sender: "bot",
        text:
          data.answer ||
          data.response ||
          "I'm having trouble responding right now. Please try again.",
        timestamp: new Date(),
        sentiment: data.sentiment?.sentiment,
        citations: data.citations,
        confidence: data.confidence,
        disclaimer: data.disclaimer,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Update thread last message time (updateChatThread saves to localStorage)
      const updatedLastMessageAt = new Date().toISOString();
      updateChatThread(activeSessionId, {
        lastMessageAt: updatedLastMessageAt,
      });
      setChatThreads((prev) =>
        prev.map((thread) =>
          thread.sessionId === activeSessionId
            ? { ...thread, lastMessageAt: updatedLastMessageAt }
            : thread
        )
      );
    } catch (err) {
      const errorMessage = {
        id: currentMessages.length + 2,
        sender: "bot",
        text: "⚠️ Oops! Something went wrong. Let's try that again!",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Error sending message:", err);
    } finally {
      setIsTyping(false);
    }
  }, [input, activeSessionId, messages, isTyping]);

  return {
    // State
    chatThreads,
    activeSessionId,
    messages,
    input,
    isTyping,
    isLoadingHistory,
    // Actions
    setInput,
    handleNewChat,
    loadChatThread,
    handleDeleteThread,
    handleSend,
  };
}
