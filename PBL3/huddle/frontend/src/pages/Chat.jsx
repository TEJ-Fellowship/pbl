import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getAllUsers,
  sendFriendRequest,
  respondToFriendRequest,
  getFriendRequests,
  getFriends,
} from "../api/friends";
import { getUserChats, getOrCreateChat } from "../api/chat";
import { MessageCircle, Users, UserPlus, Check, X, Search } from "lucide-react";
import ChatWindow from "../components/ChatWindow";

const Chat = () => {
  const [activeTab, setActiveTab] = useState("chats");
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUsers(),
        fetchFriends(),
        fetchFriendRequests(),
        fetchChats(),
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load chat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchFriends = async () => {
    try {
      const friendsData = await getFriends();
      setFriends(friendsData);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const requestsData = await getFriendRequests();
      setFriendRequests(requestsData);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };

  const fetchChats = async () => {
    try {
      const chatsData = await getUserChats();
      setChats(chatsData);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      toast.success("Friend request sent!");
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRespondToRequest = async (requestId, action) => {
    try {
      await respondToFriendRequest(requestId, action);
      toast.success(`Friend request ${action}ed!`);
      fetchFriendRequests();
      fetchFriends();
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleStartChat = async (friendId) => {
    try {
      const chat = await getOrCreateChat(friendId);
      setSelectedChat(chat);
      setActiveTab("chats");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFriends = friends.filter(
    (friend) =>
      friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (selectedChat) {
    return (
      <ChatWindow
        chat={selectedChat}
        onBack={() => setSelectedChat(null)}
        onUpdateChats={fetchChats}
      />
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {/* Header */}
        <div className="border-b border-slate-200 p-6 bg-gradient-to-r from-teal-50 to-cyan-50">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Chat</h1>

          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "chats"
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Chats ({chats.length})
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "friends"
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab("discover")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "discover"
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Discover
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "requests"
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Requests ({friendRequests.length})
            </button>
          </div>
        </div>

        {/* Search */}
        {(activeTab === "friends" || activeTab === "discover") && (
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Chats Tab */}
          {activeTab === "chats" && (
            <div className="space-y-4">
              {chats.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">
                    No chats yet. Start a conversation with a friend!
                  </p>
                </div>
              ) : (
                chats.map((chat) => {
                  // Get current user ID from token
                  const getCurrentUserId = () => {
                    try {
                      const token = Cookies.get("token");
                      if (token) {
                        const payload = JSON.parse(atob(token.split(".")[1]));
                        return payload._id || payload.id || payload.userId;
                      }
                    } catch (error) {
                      console.error("Error getting user ID:", error);
                    }
                    return null;
                  };
                  
                  const currentUserId = getCurrentUserId();
                  const otherParticipant = chat.participants.find(
                    (p) => p._id !== currentUserId
                  );
                  
                  return (
                    <div
                      key={chat._id}
                      onClick={() => setSelectedChat(chat)}
                      className="flex items-center p-4 hover:bg-teal-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-teal-200"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold mr-4 shadow-md">
                        {otherParticipant?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">
                          {otherParticipant?.username}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {chat.lastMessage
                            ? "Last message..."
                            : "Start a conversation"}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(chat.lastActivity).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === "friends" && (
            <div className="space-y-4">
              {filteredFriends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">
                    No friends yet. Send some friend requests!
                  </p>
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center justify-between p-4 hover:bg-teal-50 rounded-lg border border-transparent hover:border-teal-200 transition-all"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold mr-4 shadow-md">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {friend.username}
                        </h3>
                        <p className="text-sm text-slate-500">{friend.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartChat(friend._id)}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                    >
                      Chat
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Discover Tab */}
          {activeTab === "discover" && (
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No users found</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4 shadow-md">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {user.username}
                        </h3>
                        <p className="text-sm text-slate-500">{user.email}</p>
                        {user.bio && (
                          <p className="text-xs text-slate-400 mt-1">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {user.friendshipStatus === "none" && (
                        <button
                          onClick={() => handleSendFriendRequest(user._id)}
                          className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                        >
                          Add Friend
                        </button>
                      )}
                      {user.friendshipStatus === "sent" && (
                        <span className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg border border-slate-300">
                          Request Sent
                        </span>
                      )}
                      {user.friendshipStatus === "received" && (
                        <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg border border-amber-200">
                          Pending
                        </span>
                      )}
                      {user.friendshipStatus === "friends" && (
                        <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200">
                          Friends
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              {friendRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No friend requests</p>
                </div>
              ) : (
                friendRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between p-4 hover:bg-orange-50 rounded-lg border border-transparent hover:border-orange-200 transition-all"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold mr-4 shadow-md">
                        {request.requester.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {request.requester.username}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {request.requester.email}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleRespondToRequest(request._id, "accept")
                        }
                        className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleRespondToRequest(request._id, "reject")
                        }
                        className="p-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
