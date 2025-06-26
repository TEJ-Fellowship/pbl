import React, { useState } from "react";
import { Plus, Bell, User } from "lucide-react";
import Stories from "../components/myNeighbourhood/Stories";
import TaskCard from "../components/myNeighbourhood/TaskCard";
import PostForm from "../components/myNeighbourhood/PostForm";
import NavigationTab from "../components/myNeighbourhood/NavigationTab";
import CategoryFilter from "../components/myNeighbourhood/CategoryFilter";
import MainContent from "../components/myNeighbourhood/MainContent";

const MyNeighbourhood = () => {
  const [activeTab, setActiveTab] = useState("newsfeed");
  const [userRole, setUserRole] = useState("helper");
  const [showPostForm, setShowPostForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock data

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

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
  };

  const handleSetSelectedCategory = (category) => {
    setSelectedCategory(category);
  };

  const handleSetShowPostForm = (show) => {
    setShowPostForm(show);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-green-100 dark:bg-background-politeDark">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 dark:bg-background-humbleDark sticky top-0 z-50 ">
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

      <div className="w-full dark:bg-background-humbleDark">
        {/* Stories Section */}
        {/* <Stories /> */}

        {/* Navigation Tabs */}
        <NavigationTab
          activeTab={activeTab}
          handleSetActiveTab={handleSetActiveTab}
        />
        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          handleSetSelectedCategory={handleSetSelectedCategory}
        />
        {/* Main Content */}
        <MainContent
          categories={categories}
          showPostForm={showPostForm}
          handleSetShowPostForm={handleSetShowPostForm}
          selectedCategory={selectedCategory}
        />

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
