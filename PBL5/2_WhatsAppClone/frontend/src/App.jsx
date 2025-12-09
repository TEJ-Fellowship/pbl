import { useState, useEffect } from "react";
import UserSelection from "./components/UserSelection";
import ChatInterface from "./components/ChatInterface";
import { SocketProvider } from "./context/SocketContext.jsx";
import "./App.css";

const API_BASE = "http://localhost:3000/api";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
      fetchGroups();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchConversations = async () => {
    if (!currentUser?.user_id) return;
    try {
      const response = await fetch(
        `${API_BASE}/conversation/user/${currentUser.user_id}`
      );
      if (response.ok) {
        const data = await response.json();
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    }
  };

  const fetchGroups = async () => {
    if (!currentUser?.user_id) return;
    try {
      const response = await fetch(
        `${API_BASE}/groups/user/${currentUser.user_id}`
      );
      if (response.ok) {
        const data = await response.json();
        setGroups(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    }
  };

  const createUser = async (name, phone) => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (response.ok) {
        const data = await response.json();
        const newUser = data.data;
        setUsers([...users, newUser]);
        return newUser;
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
    return null;
  };

  const handleUserSelect = (user) => setCurrentUser(user);

  const handleNewConversation = (conversation) => {
    setConversations([conversation, ...conversations]);
  };

  const handleNewGroup = (group) => {
    setGroups([group, ...groups]);
  };

  if (!currentUser) {
    return (
      <UserSelection
        users={users}
        onUserSelect={handleUserSelect}
        onCreateUser={createUser}
      />
    );
  }

  return (
    <SocketProvider currentUser={currentUser}>
      <ChatInterface
        currentUser={currentUser}
        conversations={conversations}
        groups={groups}
        users={users}
        onNewConversation={handleNewConversation}
        onNewGroup={handleNewGroup}
        onRefreshGroups={fetchGroups}
        onLogout={() => setCurrentUser(null)}
      />
    </SocketProvider>
  );
}

export default App;