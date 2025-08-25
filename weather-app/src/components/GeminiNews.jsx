import React, { useState, useRef, useEffect } from "react";


/**
 * GeminiNews - Grid display with animated title and modal for details.
 *
 * @param {Object} newsData - Object of news articles ({ city, news: [{ title, description, date }] })
 * @param {boolean} loading - Whether news is being loaded
 * @param {string} error - Error message, if any
 */
const GeminiNews = ({ newsData, loading, error }) => {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showContent, setShowContent] = useState(false);


  // Handles click to open modal
  const handleCardClick = (article) => {
    setSelectedArticle(article);
    setShowContent(true); // Show the modal content
  };

  // Handles closing the modal
  const handleCloseModal = () => {
    setSelectedArticle(null);
    setShowContent(false); // Hide the modal content
  };

  // Ref for modal content
  const modalRef = useRef(null);
 // Handle click outside to close recent searches
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showContent &&   // Check if recent searches panel is open
        modalRef.current && // modal element exists
        !modalRef.current.contains(event.target) // Click not in modal
      ) {
        setShowContent(false); //close the dropdown
      }
    };

    //Only Add event listener when panel is open
    if (showContent) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup event listener
    return () => document.removeEventListener("mousedown", handleClickOutside);
  
  }, [showContent]);


  return (
    <div className="flex flex-col w-full">
      {loading && (
        <div className="text-center text-gray-500 py-4">Loading news...</div>
      )}
      {error && (
        <div className="text-center text-red-500 py-4">{error}</div>
      )}
      {!loading &&
        !error &&
        newsData &&
        Array.isArray(newsData.news) &&
        newsData.news.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
            {newsData.news.map((article, idx) => (
              <button
                key={idx}
                type="button"
                className="flex flex-col items-center text-center h-[75px] hover:bg-gray-500 rounded-lg p-0.5 transition-colors relative"

                onClick={() => handleCardClick(article)}
               
              >
                <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-gray-100">
                  <div
                    className={`absolute top-0 left-0 w-full h-[80px]  bg-white  flex items-center justify-center  `}
                  >
                    <h3 className="text-xs font-medium text-gray-800 leading-snug px-0.5">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

      {/* Modal for article details */}
      {selectedArticle && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-40"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <ModalComponent
              article={selectedArticle}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      )}

    </div>
  );
};

const ModalComponent = ({ article, onClose }) => {
  return (
   <>
        <button
          className="absolute top-2 right-2 text-gray-400 hover:bg-red-700 hover:text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center"
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 12 12"
            stroke="currentColor"
            strokeWidth={2}
          >
            <line x1="3" y1="3" x2="9" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="9" y1="3" x2="3" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {article.title}
        </h3>
        {article.date && (
          <div className="text-xs text-gray-500 mb-2">
            {article.date}
          </div>
        )}
        <p className="text-gray-700 text-base text-justify">
          {article.description}
        </p>
    </>
  );
}

export default GeminiNews;