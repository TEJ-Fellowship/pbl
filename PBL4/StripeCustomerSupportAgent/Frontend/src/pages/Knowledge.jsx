import React, { useState } from "react";
import { motion } from "framer-motion";

const Knowledge = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All", count: 24 },
    { id: "getting-started", name: "Getting Started", count: 6 },
    { id: "payments", name: "Payments", count: 8 },
    { id: "webhooks", name: "Webhooks", count: 4 },
    { id: "troubleshooting", name: "Troubleshooting", count: 6 },
  ];

  const articles = [
    {
      id: 1,
      title: "Getting Started with Stripe API",
      description:
        "Learn how to set up your first Stripe integration and make your first payment.",
      category: "getting-started",
      readTime: "5 min read",
      difficulty: "beginner",
      lastUpdated: "2 days ago",
      views: 1247,
      tags: ["API", "Setup", "Payments"],
    },
    {
      id: 2,
      title: "Payment Methods and Cards",
      description:
        "Understanding different payment methods and how to handle card payments securely.",
      category: "payments",
      readTime: "8 min read",
      difficulty: "intermediate",
      lastUpdated: "1 week ago",
      views: 892,
      tags: ["Cards", "Security", "PCI"],
    },
    {
      id: 3,
      title: "Webhook Implementation Guide",
      description:
        "Complete guide to implementing and testing Stripe webhooks in your application.",
      category: "webhooks",
      readTime: "12 min read",
      difficulty: "advanced",
      lastUpdated: "3 days ago",
      views: 654,
      tags: ["Webhooks", "Events", "Testing"],
    },
    {
      id: 4,
      title: "Common Payment Errors",
      description:
        "Troubleshooting guide for the most common payment processing errors.",
      category: "troubleshooting",
      readTime: "6 min read",
      difficulty: "intermediate",
      lastUpdated: "5 days ago",
      views: 1234,
      tags: ["Errors", "Debugging", "Solutions"],
    },
    {
      id: 5,
      title: "Stripe Dashboard Overview",
      description:
        "Navigate and understand the Stripe dashboard features and analytics.",
      category: "getting-started",
      readTime: "4 min read",
      difficulty: "beginner",
      lastUpdated: "1 week ago",
      views: 567,
      tags: ["Dashboard", "Analytics", "Overview"],
    },
    {
      id: 6,
      title: "Subscription Billing Setup",
      description:
        "How to implement recurring billing and subscription management.",
      category: "payments",
      readTime: "15 min read",
      difficulty: "advanced",
      lastUpdated: "2 days ago",
      views: 789,
      tags: ["Subscriptions", "Recurring", "Billing"],
    },
  ];

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="fixed left-[15%] right-0 h-screen bg-surface-dark overflow-y-auto">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-dark mb-2">
            Knowledge Base
          </h1>
          <p className="text-subtle-dark">
            Find answers, guides, and best practices for Stripe integration.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search articles, guides, and documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg pl-10 pr-4 py-3 text-text-dark placeholder-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
              <h3 className="text-lg font-semibold text-text-dark mb-4">
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedCategory === category.id
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-subtle-dark hover:bg-gray-800/30 hover:text-text-dark"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-xs bg-gray-700/50 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Articles List */}
          <div className="lg:col-span-4">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-gray-800/50">
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-text-dark">
                    {selectedCategory === "all"
                      ? "All Articles"
                      : categories.find((c) => c.id === selectedCategory)?.name}
                  </h2>
                  <span className="text-subtle-dark text-sm">
                    {filteredArticles.length} articles
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {filteredArticles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-6 bg-gray-800/20 rounded-xl border border-gray-700/30 hover:bg-gray-800/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-text-dark group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(
                              article.difficulty
                            )}`}
                          >
                            {article.difficulty}
                          </span>
                          <span className="text-subtle-dark text-sm">
                            {article.readTime}
                          </span>
                        </div>
                      </div>

                      <p className="text-subtle-dark mb-4">
                        {article.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-subtle-dark">
                          <span className="flex items-center space-x-1">
                            <span className="material-symbols-outlined text-sm">
                              visibility
                            </span>
                            <span>{article.views}</span>
                          </span>
                          <span>Updated {article.lastUpdated}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {article.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Knowledge;
