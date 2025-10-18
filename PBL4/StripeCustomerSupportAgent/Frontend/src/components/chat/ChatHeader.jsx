import React from "react";
import { Link } from "react-router-dom";
import { LANDING_PAGE } from "../../constants/routes";
import StatusIndicator from "../StatusIndicator.jsx";

const ChatHeader = () => {
  return (
    <header className="flex items-center justify-between p-6 border-b border-gray-800/50">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center border border-gray-700">
          <span className="material-symbols-outlined text-primary">
            auto_awesome
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold">Stripe Support Assistant</h1>
          <StatusIndicator />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Link
          to={LANDING_PAGE}
          className="px-3 py-2 text-sm text-subtle-dark hover:text-white hover:bg-surface-dark-secondary/50 rounded-lg transition-colors"
        >
          Back to Home
        </Link>
        <button className="p-2 text-subtle-dark hover:text-white transition-colors">
          <span className="material-symbols-outlined">push_pin</span>
        </button>
        <button className="p-2 text-subtle-dark hover:text-white transition-colors">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
