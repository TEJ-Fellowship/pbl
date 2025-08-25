import React, { useState, useEffect } from "react";

const NewsContent = ({ newsData, loading, error }) => {
  const [showContent, setShowContent] = useState({});

  useEffect(() => {
    const intervals = {};
    
    if (newsData && newsData.length > 0) {
      newsData.forEach((_, index) => {
        intervals[index] = setInterval(() => {
          setShowContent(prev => ({
            ...prev,
            [index]: !prev[index]
          }));
        }, 3000); // Toggle every 3 seconds
      });
    }

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [newsData]);

  return (
    <div className="flex flex-col w-full">

     { /* Display a loading spinner when data is being fetched */}
      {loading && (
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <span className="text-gray-600 mt-2">Loading News...</span>
        </div>
      )}

        {/* Display an error message if there is an error */}
      {error && (
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <span className="text-gray-600 mt-2">{error}</span>
        </div>
      )}

        { /* Display a placeholder when no news data is available */}
      {!loading && !error && !newsData && (
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">📰</span>
          </div>
          <span className="text-gray-600 mt-2">No news available</span>
        </div>
      )}

        { /* Display news articles if available */}
      {!loading && !error && newsData && newsData.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          {newsData.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >              
            <div className="relative w-full aspect-video overflow-hidden rounded-lg">
              {/* Image container with transform */}
                <div className={`transform transition-transform duration-500 ${showContent[index] ? '-translate-y-full' : 'translate-y-0'}`}>
                  <img
                    src={article.urlToImage || 'https://placehold.co/300x200/e2e8f0/1e293b?text=News'}
                    alt={'https://placehold.co/300x200/e2e8f0/1e293b?text=News'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/300x200/e2e8f0/1e293b?text=News';
                    }}
                  />
                </div> 
                 {/* Title container with transform */}               
                <div className={`absolute top-0 left-0 w-full h-full bg-white p-3 transform transition-transform duration-500 ${showContent[index] ? 'translate-y-0' : 'translate-y-full'}`}>
                  <div className="flex items-center justify-center h-full">                    
                    
                      <h3 className="text-xs font-medium text-gray-800 line-clamp-3 leading-snug">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsContent;
