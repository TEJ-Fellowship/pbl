import { useState, useEffect } from "react";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import "./ChatInterface.css";

const API_BASE = "http://localhost:3000/api";

function ChatInterface({
  currentUser,
  conversations,
  users,
  onNewConversation,
  onLogout,
}) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({
    nextCursor: null,
    hasMore: false,
    isLoading: false,
  });

  useEffect(() => {
    if (selectedConversation) {
      // Reset messages and pagination when conversation changes
      setMessages([]);
      setPagination({ nextCursor: null, hasMore: false, isLoading: false });
      fetchMessages(selectedConversation.conversationId, null, true);
    }
  }, [selectedConversation]);

  const fetchMessages = async (conversationId, cursor = null, isInitial = false) => {
    try {
      console.log(`📥 Fetching messages:`, { conversationId, cursor, isInitial });
      setPagination((prev) => ({ ...prev, isLoading: true }));
      
      // Build URL with pagination parameters
      const limit = 50;
      const url = cursor
        ? `${API_BASE}/conversation/${conversationId}?limit=${limit}&cursor=${cursor}`
        : `${API_BASE}/conversation/${conversationId}?limit=${limit}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.data || [];
        
        console.log(`✅ Received ${newMessages.length} messages`, {
          hasMore: data.pagination?.hasMore,
          nextCursor: data.pagination?.nextCursor,
        });
        
        if (isInitial || !cursor) {
          // First load or initial fetch - replace messages
          setMessages(newMessages);
        } else {
          // Loading more - prepend older messages
          setMessages((prev) => [...newMessages, ...prev]);
        }

        // Update pagination state
        setPagination({
          nextCursor: data.pagination?.nextCursor || null,
          hasMore: data.pagination?.hasMore || false,
          isLoading: false,
        });
        
        console.log(`📊 Pagination updated:`, {
          hasMore: data.pagination?.hasMore,
          nextCursor: data.pagination?.nextCursor ? "exists" : "null",
          isLoading: false,
        });
      } else {
        console.error("❌ Failed to fetch messages:", response.status);
        setPagination((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      if (isInitial) {
        setMessages([]);
      }
      setPagination((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedConversation || !pagination.nextCursor || pagination.isLoading) {
      console.log("⚠️ Cannot load more:", {
        hasConversation: !!selectedConversation,
        hasCursor: !!pagination.nextCursor,
        isLoading: pagination.isLoading,
      });
      return;
    }

    console.log("🔄 Loading more messages with cursor:", pagination.nextCursor);
    await fetchMessages(selectedConversation.conversationId, pagination.nextCursor, false);
  };

  const startNewConversation = async (receiverId) => {
    const receiver = users.find((u) => u.user_id === receiverId);
    if (!receiver) return;

    try {
      // 1️⃣ Create conversation on backend
      const res = await fetch(`${API_BASE}/conversation/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.user_id,
          receiverId: receiverId,
        }),
      });

      const data = await res.json();
      const conversationId = data.data.conversationId;

      // 2️⃣ Create conversation object for frontend
      const newConversation = {
        conversationId,
        user1Id: currentUser.user_id,
        user2Id: receiverId,
        receiver: receiver,
        lastMessageText: "",
        lastMessageTime: new Date(),
      };

      // 3️⃣ Add to sidebar list immediately
      onNewConversation(newConversation);

      // 4️⃣ Select the conversation
      setSelectedConversation(newConversation);
    } catch (err) {
      console.error("Error starting conversation:", err);
    }
  };

  const handleConversationSelect = (conversation) => {
    // Get the other user's info
    const otherUserId =
      conversation.user1Id === currentUser.user_id
        ? conversation.user2Id
        : conversation.user1Id;
    const otherUser = users.find((u) => u.user_id === otherUserId);

    setSelectedConversation({
      ...conversation,
      receiver: otherUser,
    });
  };

  const handleMessageSent = (newMessage) => {
    // Update conversation if it was new
    if (selectedConversation && !selectedConversation.conversationId) {
      const updatedConversation = {
        ...selectedConversation,
        conversationId: newMessage.conversationId,
      };
      setSelectedConversation(updatedConversation);
      onNewConversation(updatedConversation);
    }

    // Add message to local state
    setMessages([...messages, newMessage]);
  };

  const getOtherUser = () => {
    if (!selectedConversation) return null;
    return selectedConversation.receiver;
  };

  return (
    <div className="chat-interface">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="current-user-info">
            <div className="user-avatar-small">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="current-user-name">{currentUser.name}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
        <ConversationList
          conversations={conversations}
          currentUser={currentUser}
          users={users}
          selectedConversation={selectedConversation}
          onSelectConversation={handleConversationSelect}
          onNewConversation={startNewConversation}
        />
      </div>
      <div className="chat-main">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUser={currentUser}
            receiver={getOtherUser()}
            messages={messages}
            onMessageSent={handleMessageSent}
            onMessagesUpdate={setMessages}
            pagination={pagination}
            onLoadMore={loadMoreMessages}
          />
        ) : (
          <div className="no-conversation">
            <div className="no-conversation-content">
              <h2>Select a conversation to start chatting</h2>
              <p>Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatInterface;
