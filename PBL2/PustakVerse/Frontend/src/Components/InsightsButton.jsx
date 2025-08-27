import React, { useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";
import InsightsModal from "./InsightsModal";

const InsightsButton = ({ book }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Only show for Google Books
  const isGoogleBook = book.source === "online" || book.googleId;
  if (!isGoogleBook) return null;

  const handleClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/30 relative group"
        title="Get AI Insights"
      >
        <SparklesIcon className="w-4 h-4" />
        {isLoading && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
        )}
      </button>

      {showModal && (
        <InsightsModal book={book} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default InsightsButton;
