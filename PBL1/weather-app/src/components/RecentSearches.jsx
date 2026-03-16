import React from 'react';

const RecentSearches = ({ 
  recentSearches, 
  onSearchSelect, 
  onRemoveSearch, 
  onClearAll, 
  isLoading 
}) => {
  // If loading, show a loading message
  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
        <h3 className="text-white font-semibold mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Searches
        </h3>
        <div className="text-white/60 text-sm">Loading...</div>
      </div>
    );
  }
  // If no recent searches, show a message
  if (!recentSearches || recentSearches.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
        <h3 className="text-white font-semibold mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Searches
        </h3>
        <div className="text-white/60 text-sm">No recent searches yet</div>
      </div>
    );
  }
  // If there are recent searches, show them
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Searches
        </h3>
        <button
          onClick={onClearAll}
          className="text-white/60 hover:text-white text-xs px-2 py-1 rounded border border-white/20 hover:border-white/40 transition-colors"
          title="Clear all searches"
        >
          Clear All
        </button>
      </div>
      {/* Recent Searches List */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {recentSearches.map((city, index) => (
          <div
            key={`${city}-${index}`}
            className="flex items-center justify-between group bg-white/5 hover:bg-white/10 rounded-md p-2 transition-colors"
          >
            <button
              onClick={() => onSearchSelect(city)}
              className="flex-1 text-left text-white/90 hover:text-white text-sm transition-colors"
              title={`Search for ${city}`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {city}
              </span>
            </button>
            
            <button
              onClick={() => onRemoveSearch(city)}
              className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-red-400 p-1 transition-all"
              title={`Remove ${city} from recent searches`}
            >  
            {/* X icon SVG */}
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches; 