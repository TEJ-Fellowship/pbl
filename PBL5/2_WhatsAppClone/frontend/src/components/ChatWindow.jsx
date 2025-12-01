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
}) {
  const socket = useSocket();
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [receiverStatus, setReceiverStatus] = useState("offline");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
      onMessagesUpdate((prev) => {
        if (!prev.some((m) => m.messageId === message.messageId)) {
          return [...prev, message];
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !receiver) return;

    const messageContent = inputMessage.trim();
    setInputMessage("");
    setIsTyping(false);

    // Stop typing indicator
    if (socket && conversation?.conversationId) {
      socket.emit("typing:stop", conversation.conversationId);
    }

    if (!conversation.conversationId) {
      try {
        // 1️⃣ Create conversation + message via API
        const response = await fetch(`${API_BASE}/conversation/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: currentUser.user_id,
            receiverId: receiver.user_id,
            content: messageContent,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newMessage = data.data;

          // 2️⃣ Update conversation state
          onMessageSent(newMessage);

          // 3️⃣ Join the socket room
          if (socket && newMessage.conversationId) {
            socket.emit("conversation:join", newMessage.conversationId);

            // 4️⃣ Emit the message via socket immediately
            socket.emit("message:send", {
              conversationId: newMessage.conversationId,
              senderId: currentUser.user_id,
              content: messageContent,
            });
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    } else {
      // Existing conversation: send via socket
      if (socket) {
        socket.emit("message:send", {
          conversationId: conversation.conversationId,
          senderId: currentUser.user_id,
          content: messageContent,
        });

        // Optimistic UI
        const tempMessage = {
          messageId: `temp-${Date.now()}`,
          conversationId: conversation.conversationId,
          senderId: currentUser.user_id,
          content: messageContent,
          createdAt: new Date(),
        };
        onMessagesUpdate((prev) => [...prev, tempMessage]);
      }
    }
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

      <div className="chat-messages">
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
