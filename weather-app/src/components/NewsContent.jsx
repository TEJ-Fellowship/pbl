import React from "react";

const NewsContent = ({ newsData, loading, error }) => {
  return (
    <div className="flex flex-col w-full">
      {loading && (
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <span className="text-gray-600 mt-2">Loading News...</span>
        </div>
      )}

      {error && (
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <span className="text-gray-600 mt-2">{error}</span>
        </div>
      )}

      {!loading && !error && !newsData && (
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">📰</span>
          </div>
          <span className="text-gray-600 mt-2">No news available</span>
        </div>
      )}

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
              <div className="w-full aspect-video mb-2 overflow-hidden rounded-lg">
                <img
                  src={article.urlToImage || 'https://via.placeholder.com/300x200?text=News'}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=News';
                  }}
                />
              </div>
              <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                {article.title}
              </h3>
              <span className="text-xs text-gray-500 mt-1">
                {new Date(article.publishedAt).toLocaleDateString()}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsContent;
