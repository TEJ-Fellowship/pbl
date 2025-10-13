import React, { useState } from "react";
import { Search, ExternalLink, Clock, Globe, AlertCircle } from "lucide-react";

const WebSearchPanel = ({ onSearchResult, onClose }) => {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("web_search");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const searchTypes = [
    {
      id: "web_search",
      name: "General Search",
      description: "Search for recent Twilio updates and issues",
      icon: <Search className="w-4 h-4" />,
    },
    {
      id: "twilio_updates",
      name: "Twilio Updates",
      description: "Find recent Twilio news and announcements",
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: "error_solutions",
      name: "Error Solutions",
      description: "Search for solutions to specific error codes",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    {
      id: "community_discussions",
      name: "Community",
      description: "Find community discussions and forum posts",
      icon: <Globe className="w-4 h-4" />,
    },
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      let endpoint = "/api/search/web";
      let body = { query, options: { maxResults: 8 } };

      switch (searchType) {
        case "twilio_updates":
          endpoint = "/api/search/updates";
          break;
        case "error_solutions":
          endpoint = "/api/search/error-solutions";
          body = { errorCode: query, query: "", options: { maxResults: 8 } };
          break;
        case "community_discussions":
          endpoint = "/api/search/community";
          break;
        default:
          break;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      
      if (onSearchResult) {
        onSearchResult(data);
      }
    } catch (err) {
      setError(err.message);
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceColor = (source) => {
    const colors = {
      twilio_official: "bg-red-100 text-red-800",
      twilio_support: "bg-red-100 text-red-800",
      github: "bg-gray-100 text-gray-800",
      stackoverflow: "bg-orange-100 text-orange-800",
      reddit: "bg-orange-100 text-orange-800",
      dev_to: "bg-purple-100 text-purple-800",
      medium: "bg-green-100 text-green-800",
      other: "bg-blue-100 text-blue-800",
    };
    return colors[source] || colors.other;
  };

  const formatSource = (source) => {
    const sourceMap = {
      twilio_official: "Twilio Official",
      twilio_support: "Twilio Support",
      github: "GitHub",
      stackoverflow: "Stack Overflow",
      reddit: "Reddit",
      dev_to: "Dev.to",
      medium: "Medium",
      other: "Other",
    };
    return sourceMap[source] || source;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Web Search</h2>
            <p className="text-sm text-gray-500">
              Search for recent Twilio updates, issues, and community discussions
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Form */}
        <div className="p-6 border-b border-gray-200">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {searchTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSearchType(type.id)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                      searchType === type.id
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {type.icon}
                    <div className="text-left">
                      <div className="font-medium text-sm">{type.name}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Query Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {searchType === "error_solutions" ? "Error Code" : "Search Query"}
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchType === "error_solutions"
                      ? "e.g., 30001, 20003, 40001"
                      : "e.g., twilio sms api, webhook issues, recent updates"
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{isLoading ? "Searching..." : "Search"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-medium">Search Error</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {results && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Search Results ({results.results?.length || 0})
                </h3>
                {results.responseTime && (
                  <span className="text-sm text-gray-500">
                    Found in {results.responseTime}ms
                  </span>
                )}
              </div>

              {results.results && results.results.length > 0 ? (
                <div className="space-y-4">
                  {results.results.map((result, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                            {result.title}
                          </h4>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                            {result.snippet}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded-full ${getSourceColor(result.source)}`}>
                              {formatSource(result.source)}
                            </span>
                            {result.relevance && (
                              <span>Relevance: {result.relevance.toFixed(1)}</span>
                            )}
                            {result.timestamp && (
                              <span>
                                {new Date(result.timestamp).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No results found for your search query.</p>
                  <p className="text-sm">Try different keywords or search types.</p>
                </div>
              )}
            </div>
          )}

          {!results && !error && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Search for Twilio Information</p>
              <p className="text-sm">Use the search form above to find recent updates, solutions, and discussions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSearchPanel;
