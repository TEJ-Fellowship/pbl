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
      className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/30"
      title="Get AI Insights"
    >
      <SparklesIcon className="w-4 h-4" />
    </button>
  );
};

export default InsightsButton;
