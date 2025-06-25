import React from "react";

const NavigationTab = ({ activeTab, handleSetActiveTab }) => {
  return (
    <div>
      <div className="px-6 mb-4">
        <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => handleSetActiveTab("newsfeed")}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "newsfeed"
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Help Feed
          </button>
          <button
            onClick={() => handleSetActiveTab("explore")}
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
    </div>
  );
};

export default NavigationTab;
