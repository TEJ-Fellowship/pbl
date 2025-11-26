import { useState, useEffect } from 'react'
import ConversationList from './ConversationList'
import ChatWindow from './ChatWindow'
import './ChatInterface.css'

const API_BASE = 'http://localhost:3000/api'

function ChatInterface({
  currentUser,
  conversations,
  users,
  onNewConversation,
  onLogout,
}) {
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversationId)
    }
  }, [selectedConversation])

  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`${API_BASE}/conversation/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }

  const startNewConversation = async (receiverId) => {
    // Find receiver user info
    const receiver = users.find((u) => u.user_id === receiverId)
    if (!receiver) return

    // Create a new conversation object (will be created when first message is sent)
    const newConversation = {
      conversationId: null, // Will be generated on first message
      user1Id: currentUser.user_id,
      user2Id: receiverId,
      receiver: receiver,
      lastMessageText: '',
      lastMessageTime: new Date(),
    }

    setSelectedConversation(newConversation)
  }

  const handleConversationSelect = (conversation) => {
    // Get the other user's info
    const otherUserId =
      conversation.user1Id === currentUser.user_id
        ? conversation.user2Id
        : conversation.user1Id
    const otherUser = users.find((u) => u.user_id === otherUserId)

    setSelectedConversation({
      ...conversation,
      receiver: otherUser,
    })
  }

  const handleMessageSent = (newMessage) => {
    // Update conversation if it was new
    if (selectedConversation && !selectedConversation.conversationId) {
      const updatedConversation = {
        ...selectedConversation,
        conversationId: newMessage.conversationId,
      }
      setSelectedConversation(updatedConversation)
      onNewConversation(updatedConversation)
    }

    // Add message to local state
    setMessages([...messages, newMessage])
  }

  const getOtherUser = () => {
    if (!selectedConversation) return null
    return selectedConversation.receiver
  }

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
  )
}

export default ChatInterface

