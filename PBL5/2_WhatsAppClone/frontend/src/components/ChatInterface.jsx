import { useState, useEffect } from "react";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import GroupCreationModal from "./GroupCreationModal";
import "./ChatInterface.css";

const API_BASE = "http://localhost:3000/api";

function ChatInterface({
  currentUser,
  conversations,
  groups,
  users,
  onNewConversation,
  onNewGroup,
  onRefreshGroups,
  onLogout,
}) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [pagination, setPagination] = useState({
    nextCursor: null,
    hasMore: false,
    isLoading: false,
  });

  useEffect(() => {
    if (selectedConversation) {
      setMessages([]);
      setPagination({ nextCursor: null, hasMore: false, isLoading: false });
      fetchMessages(selectedConversation.conversationId, null, true);
    }
  }, [selectedConversation]);

  const fetchMessages = async (conversationId, cursor = null, isInitial = false) => {
    try {
      console.log(`📥 Fetching messages:`, { conversationId, cursor, isInitial });
      setPagination((prev) => ({ ...prev, isLoading: true }));
      
      const limit = 50;
      const url = cursor
        ? `${API_BASE}/conversation/${conversationId}?limit=${limit}&cursor=${cursor}`
        : `${API_BASE}/conversation/${conversationId}?limit=${limit}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.data || [];
        
        if (isInitial || !cursor) {
          setMessages(newMessages);
        } else {
          setMessages((prev) => [...newMessages, ...prev]);
        }

        setPagination({
          nextCursor: data.pagination?.nextCursor || null,
          hasMore: data.pagination?.hasMore || false,
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
      return;
    }
    await fetchMessages(selectedConversation.conversationId, pagination.nextCursor, false);
  };

  const startNewConversation = async (receiverId) => {
    const receiver = users.find((u) => u.user_id === receiverId);
    if (!receiver) return;

    try {
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

      const newConversation = {
        conversationId,
        user1Id: currentUser.user_id,
        user2Id: receiverId,
        receiver: receiver,
        lastMessageText: "",
        lastMessageTime: new Date(),
        type: 'direct',
      };

      onNewConversation(newConversation);
      setSelectedConversation(newConversation);
    } catch (err) {
      console.error("Error starting conversation:", err);
    }
  };

  const handleConversationSelect = (conversation) => {
    if (conversation.type === 'group') {
      // For groups, set group info
      setSelectedConversation({
        ...conversation,
        isGroup: true,
        groupId: conversation.groupId,
        groupName: conversation.groupName,
      });
    } else {
      // For direct conversations
      const otherUserId =
        conversation.user1Id === currentUser.user_id
          ? conversation.user2Id
          : conversation.user1Id;
      const otherUser = users.find((u) => u.user_id === otherUserId);

      setSelectedConversation({
        ...conversation,
        receiver: otherUser,
        isGroup: false,
      });
    }
  };

  const handleGroupCreated = (groupData) => {
    const newGroup = {
      conversationId: groupData.conversationId,
      groupId: groupData.groupId,
      groupName: groupData.groupName,
      lastMessageText: "",
      lastMessageTime: new Date(),
      type: 'group',
    };
    onNewGroup(newGroup);
    setSelectedConversation(newGroup);
    onRefreshGroups();
  };

  const handleMessageSent = (newMessage) => {
    if (selectedConversation && !selectedConversation.conversationId) {
      const updatedConversation = {
        ...selectedConversation,
        conversationId: newMessage.conversationId,
      };
      setSelectedConversation(updatedConversation);
      if (selectedConversation.isGroup) {
        onNewGroup(updatedConversation);
      } else {
        onNewConversation(updatedConversation);
      }
    }
    setMessages([...messages, newMessage]);
  };

  const getOtherUser = () => {
    if (!selectedConversation) return null;
    if (selectedConversation.isGroup) return null; // Groups don't have a single receiver
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
          groups={groups}
          currentUser={currentUser}
          users={users}
          selectedConversation={selectedConversation}
          onSelectConversation={handleConversationSelect}
          onNewConversation={startNewConversation}
          onShowCreateGroup={() => setShowCreateGroup(true)}
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
      {showCreateGroup && (
        <GroupCreationModal
          currentUser={currentUser}
          users={users}
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}

export default ChatInterface;