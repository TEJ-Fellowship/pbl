import React from "react";
import { useNavigate } from "react-router-dom";
import { SparklesIcon } from "@heroicons/react/24/solid";

const InsightsButton = ({ book }) => {
  const navigate = useNavigate();

  // Only show for Google Books
  const isGoogleBook = book.source === "online" || book.googleId;
  if (!isGoogleBook) return null;

  const handleClick = () => {
    // Navigate directly to the detailed insights page
    navigate(`/insights/${book._id || book.googleId}`);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:scale-105 hover:from-purple-600 hover:to-pink-600 transition-transform duration-200"
      title="Get AI Insights"
    >
      <SparklesIcon className="w-5 h-5" />
      <span>AI Insights</span>
    </button>
  );
};

export default InsightsButton;
