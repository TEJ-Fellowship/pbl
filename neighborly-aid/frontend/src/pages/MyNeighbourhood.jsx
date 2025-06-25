import React, { useState } from "react";
import { Plus, Bell, User } from "lucide-react";
import Stories from "../components/myNeighbourhood/Stories";
import TaskCard from "../components/myNeighbourhood/TaskCard";
import PostForm from "../components/myNeighbourhood/PostForm";

const MyNeighbourhood = () => {
  const [activeTab, setActiveTab] = useState("newsfeed");
  const [userRole, setUserRole] = useState("helper");
  const [showPostForm, setShowPostForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock data

  const tasks = [
    {
      id: 1,
      user: "Sarah Martinez",
      avatar: "👩‍🦰",
      time: "2 hours ago",
      category: "groceries",
      urgency: "medium",
      title: "Need groceries picked up from Whole Foods",
      description:
        "I'm recovering from surgery and need someone to pick up a few essentials. I have a list ready and can pay via app.",
      location: "0.3 miles away",
      likes: 12,
      comments: 5,
      helpers: 3,
      karma: 45,
      status: "open",
    },
    {
      id: 2,
      user: "Mike Rodriguez",
      avatar: "👨‍🦲",
      time: "4 hours ago",
      category: "tech",
      urgency: "low",
      title: "Help setting up new smart TV",
      description:
        'Just got a new 65" smart TV and need help mounting it on the wall and connecting to WiFi. Pizza and drinks provided!',
      location: "0.7 miles away",
      likes: 8,
      comments: 12,
      helpers: 1,
      karma: 32,
      status: "in-progress",
    },
    {
      id: 3,
      user: "Emma Chen",
      avatar: "👩‍🦱",
      time: "6 hours ago",
      category: "pets",
      urgency: "high",
      title: "Emergency dog walking needed",
      description:
        "My Golden Retriever Max needs an urgent walk. I'm stuck at work and he's been inside for 8 hours. He's very friendly!",
      location: "0.5 miles away",
      likes: 24,
      comments: 8,
      helpers: 5,
      karma: 67,
      status: "completed",
    },
  ];

  const categories = [
    {
      id: "all",
      name: "All Tasks",
      icon: "🏠",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "groceries",
      name: "Groceries",
      icon: "🛒",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "tech",
      name: "Tech Help",
      icon: "💻",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "pets",
      name: "Pet Care",
      icon: "🐕",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "transport",
      name: "Transport",
      icon: "🚗",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "cleaning",
      name: "Cleaning",
      icon: "🧹",
      color: "bg-green-100 text-green-800",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-green-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              HelpBoard
            </h1>
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-gray-600" />
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Stories Section */}
        <Stories />

        {/* Navigation Tabs */}
        <div className="px-6 mb-4">
          <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("newsfeed")}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "newsfeed"
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Help Feed
            </button>
            <button
              onClick={() => setActiveTab("explore")}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "explore"
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Explore
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-6 mb-4">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-transparent"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-20">
          {/* What's on your mind */}
          {!showPostForm && (
            <div
              onClick={() => setShowPostForm(true)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-gray-500">
                  What help do you need today?
                </div>
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🛒</span>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">💻</span>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🐕</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showPostForm && <PostForm />}

          {/* Tasks Feed */}
          <div className="space-y-4">
            {tasks
              .filter(
                (task) =>
                  selectedCategory === "all" ||
                  task.category === selectedCategory
              )
              .map((task) => (
                <TaskCard key={task.id} task={task} categories={categories} />
              ))}
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setShowPostForm(true)}
            className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyNeighbourhood;
