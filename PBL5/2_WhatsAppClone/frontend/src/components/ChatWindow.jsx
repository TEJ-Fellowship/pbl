import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext.jsx";
import "./ChatWindow.css";

const API_BASE = "http://localhost:3000/api";

function ChatWindow({
  conversation,
  currentUser,
  receiver,
  messages,
  onMessageSent,
  onMessagesUpdate,
  pagination,
  onLoadMore,
}) {
  const socket = useSocket();
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [receiverStatus, setReceiverStatus] = useState("offline");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const previousMessagesLengthRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = ({ userId, status }) => {
      console.log(userId, status);
      if (userId === receiver.user_id) {
        setReceiverStatus(status);
      }
      console.log(receiverStatus);
    };

    socket.on("user:status", handleStatusUpdate);

    const interval = setInterval(() => {
      socket.emit("heartbeat");
    }, 10000); // every 10 seconds

    // Join conversation room
    if (conversation?.conversationId && receiver?.user_id) {
      socket.emit("conversation:join", {
        conversationId: conversation.conversationId,
        receiver: { user_id: receiver.user_id },
      });
    }

    socket.on("message:send", (message) => {
      console.log("📨 Real-time message received:", message);
      onMessagesUpdate((prev) => {
        // Check if message already exists to prevent duplicates
        const messageExists = prev.some(
          (m) =>
            m.messageId === message.messageId ||
            (m.messageId &&
              message.messageId &&
              m.messageId.toString() === message.messageId.toString())
        );

        if (!messageExists) {
          console.log("✅ Adding new message to state");
          return [...prev, message];
        } else {
          console.log("⚠️ Message already exists, skipping");
        }
        return prev;
      });
    });

    socket.on("typing:start", (userId) => {
      if (userId !== currentUser.user_id) {
        setTypingUsers((prev) => new Set(prev).add(userId));
      }
    });

    socket.on("typing:stop", (userId) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      socket.off("message:send");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("user:status", handleStatusUpdate);
      clearInterval(interval);
    };
  }, [
    socket,
    conversation?.conversationId,
    currentUser.user_id,
    receiver.user_id,
    onMessagesUpdate,
  ]);

  // Infinite scroll: Load more when user scrolls near the top
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !pagination?.hasMore || pagination?.isLoading) {
      if (!container) console.log("⚠️ No container for scroll");
      if (!pagination?.hasMore) console.log("⚠️ No more messages to load");
      if (pagination?.isLoading)
        console.log("⏳ Already loading, skipping scroll handler");
      return;
    }

    const handleScroll = () => {
      // Check if user scrolled near the top (within 200px)
      const scrollTop = container.scrollTop;
      const scrollThreshold = 200;

      if (scrollTop < scrollThreshold && !isLoadingMoreRef.current) {
        console.log("🔄 Scroll detected near top, triggering load more");
        isLoadingMoreRef.current = true;
        onLoadMore();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [pagination?.hasMore, pagination?.isLoading, onLoadMore]);

  // Reset loading ref when loading completes
  useEffect(() => {
    if (!pagination?.isLoading) {
      isLoadingMoreRef.current = false;
    }
  }, [pagination?.isLoading]);

  // Handle scroll position when loading older messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const currentLength = messages.length;
    const previousLength = previousMessagesLengthRef.current;

    // If messages increased and we're loading more (not initial load)
    if (
      currentLength > previousLength &&
      previousLength > 0 &&
      pagination?.isLoading === false
    ) {
      // We loaded older messages - preserve scroll position
      requestAnimationFrame(() => {
        const scrollHeightBefore = container.scrollHeight;
        const scrollTopBefore = container.scrollTop;

        requestAnimationFrame(() => {
          const scrollHeightAfter = container.scrollHeight;
          const heightDifference = scrollHeightAfter - scrollHeightBefore;
          container.scrollTop = scrollTopBefore + heightDifference;
        });
      });
    } else if (currentLength !== previousLength && previousLength === 0) {
      // Initial load - scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }

    previousMessagesLengthRef.current = currentLength;
  }, [messages, pagination?.isLoading]);

  // Scroll to bottom when new messages arrive (not from pagination)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Only auto-scroll if user is near bottom (within 100px)
    // This prevents scrolling when user is reading older messages
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    if (messages.length > 0 && !pagination?.isLoading && isNearBottom) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages.length, pagination?.isLoading]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !receiver) return;

    const messageContent = inputMessage.trim();
    setInputMessage("");
    setIsTyping(false);

    // stop typing
    if (socket) {
      socket.emit("typing:stop", conversation.conversationId);
    }

    // 🚀 Emit message directly to socket
    socket.emit("message:send", {
      conversationId: conversation.conversationId,
      senderId: currentUser.user_id,
      receiverId: receiver.user_id,
      content: messageContent,
    });

    // ⚡ Optimistic UI
    const tempMessage = {
      messageId: `temp-${Date.now()}`,
      conversationId: conversation.conversationId,
      senderId: currentUser.user_id,
      content: messageContent,
      createdAt: new Date(),
    };

    onMessagesUpdate((prev) => [...prev, tempMessage]);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (!isTyping && socket && conversation?.conversationId) {
      setIsTyping(true);
      socket.emit("typing:start", conversation.conversationId);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (socket && conversation?.conversationId) {
        socket.emit("typing:stop", conversation.conversationId);
        setIsTyping(false);
      }
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!receiver) {
    return (
      <div className="chat-window">
        <div className="no-receiver">Loading...</div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-user">
          <div className="user-avatar-medium">
            {receiver.name.charAt(0).toUpperCase()}
          </div>
          <div className="chat-header-info">
            <div className="chat-header-name">{receiver.name}</div>
            <div className="chat-header-status">
              {typingUsers.size > 0 ? "typing..." : receiverStatus}
            </div>
          </div>
        </div>
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
        {/* Infinite Scroll Loading Indicator - Shows at top when loading older messages */}
        {pagination?.isLoading && (
          <div className="infinite-scroll-loader">
            <span className="loading-spinner"></span>
            <span>Loading older messages...</span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUser.user_id;
            const showAvatar =
              index === 0 || messages[index - 1].senderId !== message.senderId;

            return (
              <div
                key={message.messageId || index}
                className={`message-wrapper ${isOwnMessage ? "own" : "other"}`}
              >
                {!isOwnMessage && showAvatar && (
                  <div className="message-avatar">
                    {receiver.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  className={`message ${isOwnMessage ? "sent" : "received"}`}
                >
                  <div className="message-content">{message.content}</div>
                  <div className="message-time">
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <button className="send-button" onClick={sendMessage}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
