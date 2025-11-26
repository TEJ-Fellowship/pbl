import { useState, useEffect } from 'react'
import UserSelection from './components/UserSelection'
import ChatInterface from './components/ChatInterface'
import './App.css'

const API_BASE = 'http://localhost:3000/api'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [conversations, setConversations] = useState([])

  // Fetch all users on mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Fetch conversations when user is selected
  useEffect(() => {
    if (currentUser) {
      fetchConversations()
    }
  }, [currentUser])

  const fetchUsers = async () => {
    try {
      // First, try to get existing users
      // For now, we'll create users if they don't exist
      // In a real app, you'd have a proper user management system
      const response = await fetch(`${API_BASE}/users`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchConversations = async () => {
    if (!currentUser?.user_id) return
    
    try {
      const response = await fetch(`${API_BASE}/conversation/user/${currentUser.user_id}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setConversations([])
    }
  }

  const createUser = async (name, phone) => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const newUser = data.data
        setUsers([...users, newUser])
        return newUser
      }
    } catch (error) {
      console.error('Error creating user:', error)
    }
    return null
  }

  const handleUserSelect = (user) => {
    setCurrentUser(user)
  }

  const handleNewConversation = (conversation) => {
    setConversations([conversation, ...conversations])
  }

  if (!currentUser) {
    return (
      <UserSelection
        users={users}
        onUserSelect={handleUserSelect}
        onCreateUser={createUser}
      />
    )
  }

  return (
    <ChatInterface
      currentUser={currentUser}
      conversations={conversations}
      users={users}
      onNewConversation={handleNewConversation}
      onLogout={() => setCurrentUser(null)}
    />
  )
}

export default App

