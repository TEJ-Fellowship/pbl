import React, { useState } from "react";
import { Search, ArrowLeft, BookOpen, MessageCircle, ExternalLink, Filter, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock search results - replace with actual API call
  const mockResults = [
    {
      id: 1,
      title: "How to create an email campaign in MailChimp",
      description: "Learn how to create and send your first email campaign using MailChimp's campaign builder.",
      category: "campaigns",
      type: "article",
      url: "#",
      rating: 4.8,
      views: 1250,
      lastUpdated: "2 days ago"
    },
    {
      id: 2,
      title: "Setting up automation workflows",
      description: "Step-by-step guide to creating automated email sequences for your subscribers.",
      category: "automation",
      type: "tutorial",
      url: "#",
      rating: 4.6,
      views: 890,
      lastUpdated: "1 week ago"
    },
    {
      id: 3,
      title: "Managing subscriber lists and segments",
      description: "Best practices for organizing and managing your subscriber lists effectively.",
      category: "lists",
      type: "guide",
      url: "#",
      rating: 4.7,
      views: 2100,
      lastUpdated: "3 days ago"
    },
    {
      id: 4,
      title: "Troubleshooting delivery issues",
      description: "Common email delivery problems and how to resolve them quickly.",
      category: "troubleshooting",
      type: "article",
      url: "#",
      rating: 4.5,
      views: 750,
      lastUpdated: "5 days ago"
    },
    {
      id: 5,
      title: "Integrating MailChimp with your website",
      description: "Connect MailChimp with your website using forms, pop-ups, and API integration.",
      category: "integration",
      type: "tutorial",
      url: "#",
      rating: 4.9,
      views: 1680,
      lastUpdated: "1 day ago"
    }
  ];

  const categories = [
    { id: "all", name: "All Topics", count: mockResults.length },
    { id: "campaigns", name: "Campaigns", count: 1 },
    { id: "automation", name: "Automation", count: 1 },
    { id: "lists", name: "Lists & Segments", count: 1 },
    { id: "troubleshooting", name: "Troubleshooting", count: 1 },
    { id: "integration", name: "Integration", count: 1 }
  ];

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
      const filteredResults = mockResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filteredResults);
      setIsSearching(false);
    }, 800);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "article":
        return <BookOpen size={16} className="text-blue-500" />;
      case "tutorial":
        return <MessageCircle size={16} className="text-green-500" />;
      case "guide":
        return <BookOpen size={16} className="text-purple-500" />;
      default:
        return <BookOpen size={16} className="text-gray-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "article":
        return "bg-blue-100 text-blue-800";
      case "tutorial":
        return "bg-green-100 text-green-800";
      case "guide":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-yellow-400 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-600 hover:text-yellow-600">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Search Help Center</h1>
          </div>
          <Link
            to="/chat"
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
          >
            Start Chat
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help articles, tutorials, and guides..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-lg"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <span className="text-sm text-gray-600">Filter by category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.count})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={!searchQuery.trim() || isSearching}
                className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results ({searchResults.length})
              </h2>
              <span className="text-sm text-gray-500">
                Found in {isSearching ? "..." : "0.3s"}
              </span>
            </div>

            {searchResults.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-xl border-l-4 border-l-yellow-400 border border-gray-200 p-6 hover:shadow-md hover:border-l-yellow-400-dark transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(result.type)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                        {result.type}
                      </span>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} className="fill-current" />
                        <span className="text-sm text-gray-600">{result.rating}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-yellow-600 cursor-pointer">
                      {result.title}
                    </h3>
                    <p className="text-gray-600 mb-3 leading-relaxed">
                      {result.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>Updated {result.lastUpdated}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{result.views.toLocaleString()} views</span>
                      </div>
                    </div>
                  </div>
                  <button className="ml-4 p-2 text-gray-400 hover:text-yellow-600 transition-colors">
                    <ExternalLink size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any articles matching "{searchQuery}". Try different keywords or browse our categories.
            </p>
            <Link
              to="/chat"
              className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
            >
              Ask our AI assistant instead
            </Link>
          </div>
        )}

        {/* Popular Topics */}
        {!searchQuery && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Popular Topics</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.slice(1).map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-yellow-400 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSearchQuery(category.name);
                    handleSearch(category.name);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <span className="text-sm text-gray-500">{category.count} articles</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
