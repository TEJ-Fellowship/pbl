import React, { useState } from "react";
import { ArrowLeft, BookOpen, MessageCircle, Users, Settings, BarChart3, Zap, Mail, Filter, Search, ExternalLink, Clock, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const HelpCenter = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      id: "getting-started",
      name: "Getting Started",
      icon: <BookOpen size={24} />,
      color: "bg-blue-100 text-blue-600",
      description: "Learn the basics of Mailchimp",
      articles: 15
    },
    {
      id: "campaigns",
      name: "Email Campaigns",
      icon: <Mail size={24} />,
      color: "bg-green-100 text-green-600",
      description: "Create and send email campaigns",
      articles: 23
    },
    {
      id: "automation",
      name: "Automation",
      icon: <Zap size={24} />,
      color: "bg-purple-100 text-purple-600",
      description: "Set up automated workflows",
      articles: 18
    },
    {
      id: "audience",
      name: "Audience Management",
      icon: <Users size={24} />,
      color: "bg-orange-100 text-orange-600",
      description: "Manage subscribers and lists",
      articles: 12
    },
    {
      id: "analytics",
      name: "Reports & Analytics",
      icon: <BarChart3 size={24} />,
      color: "bg-indigo-100 text-indigo-600",
      description: "Track campaign performance",
      articles: 9
    },
    {
      id: "integrations",
      name: "Integrations",
      icon: <Settings size={24} />,
      color: "bg-gray-100 text-gray-600",
      description: "Connect with other tools",
      articles: 21
    }
  ];

  const featuredArticles = [
    {
      id: 1,
      title: "How to create your first email campaign",
      description: "Step-by-step guide to creating and sending your first email campaign in Mailchimp.",
      category: "campaigns",
      difficulty: "beginner",
      readTime: "5 min",
      rating: 4.8,
      views: 12500,
      featured: true
    },
    {
      id: 2,
      title: "Setting up welcome email automation",
      description: "Learn how to automatically send welcome emails to new subscribers.",
      category: "automation",
      difficulty: "intermediate",
      readTime: "8 min",
      rating: 4.6,
      views: 8900,
      featured: true
    },
    {
      id: 3,
      title: "Understanding email deliverability",
      description: "Best practices to ensure your emails reach your subscribers' inboxes.",
      category: "campaigns",
      difficulty: "advanced",
      readTime: "12 min",
      rating: 4.9,
      views: 15200,
      featured: true
    }
  ];

  const recentArticles = [
    {
      id: 4,
      title: "Mobile-responsive email design tips",
      description: "Create emails that look great on all devices.",
      category: "campaigns",
      difficulty: "intermediate",
      readTime: "6 min",
      rating: 4.7,
      views: 3200,
      updated: "2 days ago"
    },
    {
      id: 5,
      title: "A/B testing your email campaigns",
      description: "Learn how to test different versions of your emails to improve performance.",
      category: "analytics",
      difficulty: "intermediate",
      readTime: "10 min",
      rating: 4.5,
      views: 2100,
      updated: "1 week ago"
    },
    {
      id: 6,
      title: "GDPR compliance for email marketing",
      description: "Ensure your email marketing practices comply with GDPR regulations.",
      category: "audience",
      difficulty: "advanced",
      readTime: "15 min",
      rating: 4.8,
      views: 4500,
      updated: "3 days ago"
    }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : "bg-gray-100 text-gray-600";
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
            <h1 className="text-xl font-semibold text-gray-900">Help Center</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/search"
              className="text-gray-600 hover:text-yellow-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Search size={18} />
            </Link>
            <Link
              to="/chat"
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
            >
              Start Chat
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Find the help you need</h2>
            <p className="text-gray-600">Search our comprehensive knowledge base or browse by category</p>
          </div>
          
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, tutorials, and guides..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-yellow-400 transition-all cursor-pointer group"
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">{category.articles} articles</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Articles */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Featured Articles</h2>
            <div className="flex items-center gap-1 text-yellow-500">
              <TrendingUp size={16} />
              <span className="text-sm text-gray-600">Most Popular</span>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-yellow-400 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                    {categories.find(c => c.id === article.category)?.name}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
                    {article.difficulty}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 hover:text-yellow-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {article.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{article.readTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      <span>{article.rating}</span>
                    </div>
                  </div>
                  <span>{article.views.toLocaleString()} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Articles */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recently Updated</h2>
          <div className="space-y-4">
            {recentArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-yellow-400 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                        {categories.find(c => c.id === article.category)?.name}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
                        {article.difficulty}
                      </span>
                      <span className="text-xs text-gray-500">Updated {article.updated}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-yellow-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{article.readTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-current" />
                        <span>{article.rating}</span>
                      </div>
                      <span>{article.views.toLocaleString()} views</span>
                    </div>
                  </div>
                  <button className="ml-4 p-2 text-gray-400 hover:text-yellow-600 transition-colors">
                    <ExternalLink size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-black mb-2">Still need help?</h2>
          <p className="text-black/80 mb-6">Our AI assistant is ready to help you with any Mailchimp question</p>
          <div className="flex justify-center gap-4">
            <Link
              to="/chat"
              className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Start a Chat
            </Link>
            <Link
              to="/search"
              className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Search Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
