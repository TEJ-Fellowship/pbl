import { useState } from 'react'
import './ConversationList.css'

function ConversationList({
  conversations,
  currentUser,
  users,
  selectedConversation,
  onSelectConversation,
  onNewConversation,
}) {
  const [showUserList, setShowUserList] = useState(false)

  const getOtherUser = (conversation) => {
    const otherUserId =
      conversation.user1Id === currentUser.user_id
        ? conversation.user2Id
        : conversation.user1Id
    return users.find((u) => u.user_id === otherUserId)
  }

  const availableUsers = users.filter((u) => u.user_id !== currentUser.user_id)

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <button
          className="new-chat-btn"
          onClick={() => setShowUserList(!showUserList)}
        >
          + New Chat
        </button>
      </div>

      {showUserList && (
        <div className="user-list-modal">
          <div className="user-list-header">
            <h3>Select a user to chat with</h3>
            <button onClick={() => setShowUserList(false)}>×</button>
          </div>
          <div className="user-list-content">
            {availableUsers.length === 0 ? (
              <p className="no-users">No other users available</p>
            ) : (
              availableUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="user-list-item"
                  onClick={() => {
                    onNewConversation(user.user_id)
                    setShowUserList(false)
                  }}
                >
                  <div className="user-avatar-small">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-phone">{user.phone}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="conversations">
        {conversations.length === 0 ? (
          <div className="no-conversations">
            <p>No conversations yet</p>
            <p className="hint">Start a new chat to begin messaging</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherUser = getOtherUser(conversation)
            if (!otherUser) return null

            const isSelected =
              selectedConversation?.conversationId ===
              conversation.conversationId

            return (
              <div
                key={conversation.conversationId}
                className={`conversation-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="user-avatar-small">
                  {otherUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <span className="conversation-name">{otherUser.name}</span>
                    {conversation.lastMessageTime && (
                      <span className="conversation-time">
                        {new Date(conversation.lastMessageTime).toLocaleTimeString(
                          [],
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                    )}
                  </div>
                  <div className="conversation-preview">
                    {conversation.lastMessageText || 'No messages yet'}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ConversationList

