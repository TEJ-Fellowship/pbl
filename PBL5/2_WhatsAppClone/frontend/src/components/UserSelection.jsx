import { useState } from 'react'
import './UserSelection.css'

function UserSelection({ users, onUserSelect, onCreateUser }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (name.trim() && phone.trim()) {
      const newUser = await onCreateUser(name.trim(), phone.trim())
      if (newUser) {
        setName('')
        setPhone('')
        setShowCreateForm(false)
        onUserSelect(newUser)
      }
    }
  }

  return (
    <div className="user-selection">
      <div className="user-selection-container">
        <h1>WhatsApp Clone</h1>
        <p>Select a user to start chatting</p>

        {users.length > 0 && (
          <div className="users-list">
            <h2>Existing Users</h2>
            {users.map((user) => (
              <div
                key={user.user_id}
                className="user-card"
                onClick={() => onUserSelect(user)}
              >
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-phone">{user.phone}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showCreateForm ? (
          <button
            className="create-user-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New User
          </button>
        ) : (
          <form className="create-user-form" onSubmit={handleCreateUser}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <div className="form-buttons">
              <button type="submit">Create</button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setName('')
                  setPhone('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default UserSelection

