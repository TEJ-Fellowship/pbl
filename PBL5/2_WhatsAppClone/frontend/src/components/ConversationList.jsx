import { useState } from 'react'
import './ConversationList.css'

function ConversationList({
  conversations,
  groups,
  currentUser,
  users,
  selectedConversation,
  onSelectConversation,
  onNewConversation,
  onNewGroup,
  onShowCreateGroup,
}) {
  const [showUserList, setShowUserList] = useState(false)
  const [showGroupList, setShowGroupList] = useState(false)

  const getOtherUser = (conversation) => {
    const otherUserId =
      conversation.user1Id === currentUser.user_id
        ? conversation.user2Id
        : conversation.user1Id
    return users.find((u) => u.user_id === otherUserId)
  }

  const availableUsers = users.filter((u) => u.user_id !== currentUser.user_id)

  // Combine direct conversations and groups, sorted by last message time
  const allConversations = [
    ...conversations.map(c => ({ ...c, type: 'direct' })),
    ...groups.map(g => ({
      conversationId: g.conversation_id,
      groupId: g.group_id,
      groupName: g.group_name,
      lastMessageText: g.last_message_text,
      lastMessageTime: g.last_message_time,
      lastMessageSenderId: g.last_message_sender_id,
      type: 'group',
    }))
  ].sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
    return timeB - timeA
  })

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <button
          className="new-chat-btn"
          onClick={() => setShowUserList(!showUserList)}
        >
          + New Chat
        </button>
        <button
          className="new-group-btn"
          onClick={() => {
            setShowUserList(false)
            onShowCreateGroup && onShowCreateGroup()
          }}
        >
          + New Group
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
        {allConversations.length === 0 ? (
          <div className="no-conversations">
            <p>No conversations yet</p>
            <p className="hint">Start a new chat or create a group to begin messaging</p>
          </div>
        ) : (
          allConversations.map((conversation) => {
            const isSelected =
              selectedConversation?.conversationId === conversation.conversationId

            // For direct conversations
            if (conversation.type === 'direct') {
              const otherUser = getOtherUser(conversation)
              if (!otherUser) return null

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
            }

            // For group conversations
            if (conversation.type === 'group') {
              return (
                <div
                  key={conversation.conversationId}
                  className={`conversation-item group-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="user-avatar-small group-avatar">
                    👥
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="conversation-name">{conversation.groupName}</span>
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
            }

            return null
          })
        )}
      </div>
    </div>
  )
}

export default ConversationList