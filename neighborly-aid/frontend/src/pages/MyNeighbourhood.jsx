import React, { useState } from "react";
import { Plus } from "lucide-react";
import Stories from "../components/myNeighbourhood/Stories";
import NavigationTab from "../components/myNeighbourhood/NavigationTab";
import CategoryFilter from "../components/myNeighbourhood/CategoryFilter";
import MainContent from "../components/myNeighbourhood/MainContent";
import Header from "../components/myNeighbourhood/Header";

const MyNeighbourhood = () => {
  const [activeTab, setActiveTab] = useState("newsfeed");
  // const [userRole, setUserRole] = useState("helper");
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-green-100">
      {/* Header */}
      <Header />

      <div className="w-full">
        {/* Stories Section */}
        <Stories />

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
