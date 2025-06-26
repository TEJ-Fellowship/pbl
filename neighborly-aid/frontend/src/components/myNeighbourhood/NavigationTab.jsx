import React from "react";

const NavigationTab = ({ activeTab, handleSetActiveTab }) => {
  return (
    <div>
      <div className="p-6 mb-4">
        <div className="flex space-x-1 bg-background dark:bg-gray-700  rounded-xl p-1 shadow-sm dark:border-border-dark">
          <button
            onClick={() => handleSetActiveTab("newsfeed")}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "newsfeed"
                ? "bg-gradient-to-r from-primary-light to-primary text-background  dark:text-text-spotlight dark:hover:text-white"
                : "text-text-light hover:text-text-dark dark:text-text-spotlight dark:hover:text-white"
            }`}
          >
            Help Feed
          </button>
          <button
            onClick={() => handleSetActiveTab("explore")}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "explore"
                ? "bg-gradient-to-r from-primary-light to-primary text-background dark:text-text-spotlight dark:hover:text-white"
                : "text-text-light hover:text-text-dark dark:text-text-spotlight dark:hover:text-white"
            }`}
          >
            Explore
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavigationTab;