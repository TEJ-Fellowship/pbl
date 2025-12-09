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
  const [groupMembers, setGroupMembers] = useState([]);
  const [messageStatuses, setMessageStatuses] = useState(new Map()); // Track message statuses
  const processedMessagesRef = useRef(new Set()); // Track which messages we've processed

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const previousMessagesLengthRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const previousConversationRef = useRef(null);

  const isGroup = conversation?.isGroup || conversation?.type === "group";

  useEffect(() => {
    if (isGroup && conversation?.groupId) {
      fetchGroupMembers(conversation.groupId);
    }
  }, [isGroup, conversation?.groupId]);

  const fetchGroupMembers = async (groupId) => {
    try {
      const response = await fetch(`${API_BASE}/groups/${groupId}`);
      if (response.ok) {
        const data = await response.json();
        setGroupMembers(data.data.members || []);
      }
    } catch (error) {
      console.error("Error fetching group members:", error);
    }
  };

  // ✅ Store previous conversation ID in a ref (persists across renders)
const previousConversationIdRef = useRef(null);

useEffect(() => {
  if (!socket) return;

  const handleStatusUpdate = ({ userId, status }) => {
    if (!isGroup && receiver && userId === receiver.user_id) {
      setReceiverStatus(status);
    }
  };

  socket.on("user:status", handleStatusUpdate);

  // ✅ NEW: Listen for message status updates (delivered/read)
  const handleMessageStatus = (data) => {
    console.log(`�� [FRONTEND] Message status update received:`, data); // ✅ Enhanced logging
    
    const { messageId, status, userId } = data;
    
    if (!messageId || !status || !userId) {
      console.warn(`�� [FRONTEND] Invalid message:status data:`, data);
      return;
    }
    
    setMessageStatuses((prev) => {
      const newMap = new Map(prev);
      const key = `${messageId}-${userId}`;
      const oldStatus = newMap.get(key);
      newMap.set(key, status);
      
      console.log(`📊 [FRONTEND] Status updated:`, { 
        key, 
        oldStatus, 
        newStatus: status,
        mapSize: newMap.size,
        allStatuses: Array.from(newMap.entries())
      });
      
      return newMap;
    });
  };

  socket.on("message:status", handleMessageStatus);
  console.log(`📊 [FRONTEND] Registered message:status listener`); // ✅ Debug log

  const interval = setInterval(() => {
    socket.emit("heartbeat");
  }, 10000);

  // ✅ Get current conversation ID
  const currentConversationId = conversation?.conversationId;
  const previousConversationId = previousConversationIdRef.current;

  // ✅ Leave previous conversation if switching
  if (previousConversationId && previousConversationId !== currentConversationId) {
    socket.emit("conversation:leave", { conversationId: previousConversationId });
    console.log(`🔄 Left previous conversation: ${previousConversationId}`);
  }

  // Join conversation room
  if (currentConversationId) {
    if (isGroup && conversation?.groupId) {
      socket.emit("group:join", { groupId: conversation.groupId });
    } else if (receiver?.user_id) {
      socket.emit("conversation:join", {
        conversationId: currentConversationId,
        receiver: { user_id: receiver.user_id },
      });
    }
    
    // ✅ NEW: Emit conversation:open when joining conversation
    // Find the last message ID to mark all previous messages as read
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const lastMessageId = lastMessage.messageId?.toString() || lastMessage.messageId;
      
      socket.emit("conversation:open", {
        conversationId: currentConversationId,
        lastReadMessageId: lastMessageId,
      });
      console.log(`📖 Conversation opened, marking messages as read up to: ${lastMessageId}`);
    }
    
    // ✅ Update ref with current conversation
    previousConversationIdRef.current = currentConversationId;
  }

  // ✅ Message handler with strict conversation ID matching
  const handleMessage = (message) => {
    // ✅ CRITICAL: Only add message if it's for the current conversation
    const messageConvId = message.conversationId?.toString() || message.conversationId;
    const currentConvId = currentConversationId?.toString() || currentConversationId;
    
    if (messageConvId !== currentConvId) {
      console.log(`⚠️ Ignoring message for different conversation:`, {
        messageConvId,
        currentConvId,
        messageId: message.messageId
      });
      return;
    }
    
    const messageId = message.messageId?.toString() || message.messageId;
    const isOwnMessage = message.senderId === currentUser.user_id;
    
    console.log("📨 Real-time message received:", message);
    
    // ✅ NEW: Emit message:received if it's not our own message
    if (!isOwnMessage && !processedMessagesRef.current.has(messageId)) {
      processedMessagesRef.current.add(messageId);
      
      // Small delay to ensure message is added to state first
      setTimeout(() => {
        socket.emit("message:received", {
          messageId: messageId,
          conversationId: currentConversationId,
        });
        console.log(`✅ Emitted message:received for message: ${messageId}`);
      }, 100);
    }
    
    onMessagesUpdate((prev) => {
      // ✅ Normalize message IDs for comparison
      const messageExists = prev.some((m) => {
        const prevMessageId = m.messageId?.toString() || m.messageId;
        return prevMessageId === messageId;
      });

      if (!messageExists) {
        console.log("✅ Adding new message to state");
        // ✅ Sort messages by timestamp to maintain order
        const newMessages = [...prev, message].sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeA - timeB;
        });
        
        // ✅ NEW: Auto-mark as read if conversation is open
        if (newMessages.length > 0) {
          const lastMessage = newMessages[newMessages.length - 1];
          const lastMessageId = lastMessage.messageId?.toString() || lastMessage.messageId;
          
          // Emit conversation:open to mark all messages as read
          setTimeout(() => {
            socket.emit("conversation:open", {
              conversationId: currentConversationId,
              lastReadMessageId: lastMessageId,
            });
          }, 200);
        }
        
        return newMessages;
      } else {
        console.log("⚠️ Message already exists, skipping");
      }
      return prev;
    });
  };

  socket.on("message:send", handleMessage);

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
    // ✅ Cleanup: Remove all listeners
    socket.off("message:send", handleMessage);
    socket.off("typing:start");
    socket.off("typing:stop");
    socket.off("user:status", handleStatusUpdate);
    socket.off("message:status", handleMessageStatus); // ✅ NEW
    clearInterval(interval);
    
    // ✅ Leave conversation on cleanup
    if (previousConversationIdRef.current) {
      socket.emit("conversation:leave", { 
        conversationId: previousConversationIdRef.current 
      });
    }
  };
}, [
  socket,
  conversation?.conversationId,
  conversation?.groupId,
  currentUser.user_id,
  receiver?.user_id,
  isGroup,
  messages.length, // ✅ Add this to track when new messages arrive
  // ✅ Remove onMessagesUpdate from dependencies to prevent re-registration
]);

  // Infinite scroll: Load more when user scrolls near the top
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !pagination?.hasMore || pagination?.isLoading) {
      return;
    }

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollThreshold = 200;

      if (scrollTop < scrollThreshold && !isLoadingMoreRef.current) {
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

    if (
      currentLength > previousLength &&
      previousLength > 0 &&
      pagination?.isLoading === false
    ) {
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
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }

    previousMessagesLengthRef.current = currentLength;
  }, [messages, pagination?.isLoading]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    if (messages.length > 0 && !pagination?.isLoading && isNearBottom) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages.length, pagination?.isLoading]);

  // ✅ NEW: Helper function to get message status
  const getMessageStatus = (message) => {
    const messageId = message.messageId?.toString() || message.messageId;
    const isOwnMessage = message.senderId === currentUser.user_id;
    
    if (!isOwnMessage) {
      return null; // Status only shown for own messages
    }
    
    // For own messages, check status for the receiver
    if (isGroup) {
      // For groups, we'd need to track status per member
      // For now, just show sent
      return "sent";
    } else if (receiver?.user_id) {
      const key = `${messageId}-${receiver.user_id}`;
      const status = messageStatuses.get(key);
      return status || "sent";
    }
    
    return "sent";
  };

  // ✅ NEW: Helper function to render status icon
  const renderStatusIcon = (status) => {
    switch (status) {
      case "read":
        return "✓✓"; // Double check (blue)
      case "delivered":
        return "✓✓"; // Double check (gray)
      case "sent":
        return "✓"; // Single check
      default:
        return "✓";
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !conversation?.conversationId) return;

    const messageContent = inputMessage.trim();
    setInputMessage("");
    setIsTyping(false);

    if (socket) {
      socket.emit("typing:stop", conversation.conversationId);
    }

    if (isGroup) {
      socket.emit("message:send", {
        conversationId: conversation.conversationId,
        senderId: currentUser.user_id,
        content: messageContent,
        groupId: conversation.groupId,
      });
    } else {
      if (!receiver?.user_id) return;
      socket.emit("message:send", {
        conversationId: conversation.conversationId,
        senderId: currentUser.user_id,
        receiverId: receiver.user_id,
        content: messageContent,
      });
    }

    // // Optimistic UI
    // const tempMessage = {
    //   messageId: `temp-${Date.now()}`,
    //   conversationId: conversation.conversationId,
    //   senderId: currentUser.user_id,
    //   content: messageContent,
    //   createdAt: new Date(),
    // };

    // onMessagesUpdate((prev) => [...prev, tempMessage]);
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

  const getSenderName = (senderId) => {
    if (senderId === currentUser.user_id) return "You";
    if (isGroup) {
      const member = groupMembers.find((m) => m.user_id === senderId);
      return member?.name || "Unknown";
    }
    return receiver?.name || "Unknown";
  };

  const getDisplayName = () => {
    if (isGroup) {
      return conversation.groupName || "Group";
    }
    return receiver?.name || "Unknown";
  };

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  // ✅ FIX: Only show loading if we don't have a valid conversation
  // For groups, receiver is null (which is fine)
  // For direct chats, we need receiver
  if (!conversation?.conversationId) {
    return (
      <div className="chat-window">
        <div className="no-receiver">Loading...</div>
      </div>
    );
  }

  // ✅ FIX: For direct chats, we need receiver. For groups, we don't.
  if (!isGroup && !receiver) {
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
          <div
            className={`user-avatar-medium ${isGroup ? "group-avatar" : ""}`}
          >
            {isGroup ? "👥" : receiver.name.charAt(0).toUpperCase()}
          </div>
          <div className="chat-header-info">
            <div className="chat-header-name">{getDisplayName()}</div>
            <div className="chat-header-status">
              {isGroup
                ? `${groupMembers.length} members`
                : typingUsers.size > 0
                ? "typing..."
                : receiverStatus}
            </div>
          </div>
        </div>
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
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
            const senderName = getSenderName(message.senderId);
            const messageStatus = getMessageStatus(message); // ✅ NEW

            return (
              <div
                key={message.messageId || index}
                className={`message-wrapper ${isOwnMessage ? "own" : "other"}`}
              >
                {!isOwnMessage && showAvatar && (
                  <div className="message-avatar">
                    {isGroup
                      ? senderName.charAt(0).toUpperCase()
                      : receiver.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  className={`message ${isOwnMessage ? "sent" : "received"}`}
                >
                  {isGroup && !isOwnMessage && (
                    <div className="message-sender-name">{senderName}</div>
                  )}
                  <div className="message-content">{message.content}</div>
                  <div className="message-time-status"> {/* ✅ Updated class name */}
                    {formatTime(message.createdAt)}
                    {/* ✅ NEW: Show status for own messages */}
                    {isOwnMessage && messageStatus && (
                      <span 
                        className={`message-status message-status-${messageStatus}`}
                        title={messageStatus}
                      >
                        {renderStatusIcon(messageStatus)}
                      </span>
                    )}
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
