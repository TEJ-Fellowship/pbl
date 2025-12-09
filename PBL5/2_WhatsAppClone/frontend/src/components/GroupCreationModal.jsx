import { useState } from 'react'
import './GroupCreationModal.css'

const API_BASE = "http://localhost:3000/api";

function GroupCreationModal({ currentUser, users, onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMembers, setSelectedMembers] = useState(new Set())
  const [isCreating, setIsCreating] = useState(false)

  const availableUsers = users.filter((u) => u.user_id !== currentUser.user_id)

  const toggleMember = (userId) => {
    const newSet = new Set(selectedMembers)
    if (newSet.has(userId)) {
      newSet.delete(userId)
    } else {
      newSet.add(userId)
    }
    setSelectedMembers(newSet)
  }

  const handleCreate = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name')
      return
    }

    if (selectedMembers.size === 0) {
      alert('Please select at least one member')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch(`${API_BASE}/groups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName: groupName.trim(),
          description: description.trim() || null,
          createdBy: currentUser.user_id,
          memberIds: Array.from(selectedMembers),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onGroupCreated(data.data)
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create group')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Group Name *</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label>Select Members *</label>
            <div className="members-list">
              {availableUsers.length === 0 ? (
                <p className="no-users">No other users available</p>
              ) : (
                availableUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className={`member-item ${selectedMembers.has(user.user_id) ? 'selected' : ''}`}
                    onClick={() => toggleMember(user.user_id)}
                  >
                    <div className="user-avatar-small">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-phone">{user.phone}</div>
                    </div>
                    {selectedMembers.has(user.user_id) && (
                      <div className="checkmark">✓</div>
                    )}
                  </div>
                ))
              )}
            </div>
            <p className="hint">Selected: {selectedMembers.size} member(s)</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={isCreating}>
            Cancel
          </button>
          <button
            className="create-btn"
            onClick={handleCreate}
            disabled={isCreating || !groupName.trim() || selectedMembers.size === 0}
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GroupCreationModal