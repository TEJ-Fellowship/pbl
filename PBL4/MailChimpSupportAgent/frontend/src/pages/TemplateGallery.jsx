import React, { useState } from "react";
import { ArrowLeft, Grid, List, Search, Filter, Eye, Download, Star, Calendar, Users, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const TemplateGallery = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", name: "All Templates", count: 24 },
    { id: "newsletter", name: "Newsletter", count: 8 },
    { id: "promotional", name: "Promotional", count: 6 },
    { id: "announcement", name: "Announcement", count: 4 },
    { id: "welcome", name: "Welcome", count: 3 },
    { id: "transactional", name: "Transactional", count: 3 }
  ];

  const templates = [
    {
      id: 1,
      name: "Modern Newsletter",
      category: "newsletter",
      description: "Clean, professional newsletter template with multi-column layout",
      preview: "A sleek newsletter design perfect for regular updates",
      features: ["Responsive design", "Social media integration", "Customizable colors"],
      rating: 4.8,
      downloads: 1250,
      lastUpdated: "2 days ago",
      difficulty: "beginner",
      tags: ["newsletter", "professional", "responsive"]
    },
    {
      id: 2,
      name: "Black Friday Sale",
      category: "promotional",
      description: "Eye-catching promotional template for sales and discounts",
      preview: "Bold design with prominent call-to-action buttons",
      features: ["Hero banner", "Product showcase", "Discount codes"],
      rating: 4.9,
      downloads: 2100,
      lastUpdated: "1 week ago",
      difficulty: "intermediate",
      tags: ["sale", "promotional", "cta"]
    },
    {
      id: 3,
      name: "Product Launch",
      category: "announcement",
      description: "Exciting template for announcing new products or features",
      preview: "Dynamic layout perfect for product reveals",
      features: ["Large images", "Feature highlights", "Launch countdown"],
      rating: 4.7,
      downloads: 890,
      lastUpdated: "3 days ago",
      difficulty: "intermediate",
      tags: ["launch", "product", "announcement"]
    },
    {
      id: 4,
      name: "Welcome Series",
      category: "welcome",
      description: "Friendly template for welcoming new subscribers",
      preview: "Warm, inviting design for onboarding emails",
      features: ["Personal greeting", "Getting started guide", "Resource links"],
      rating: 4.6,
      downloads: 1560,
      lastUpdated: "5 days ago",
      difficulty: "beginner",
      tags: ["welcome", "onboarding", "friendly"]
    },
    {
      id: 5,
      name: "Event Invitation",
      category: "announcement",
      description: "Elegant template for event invitations and RSVPs",
      preview: "Sophisticated design for special events",
      features: ["Event details", "RSVP button", "Calendar integration"],
      rating: 4.5,
      downloads: 720,
      lastUpdated: "1 week ago",
      difficulty: "intermediate",
      tags: ["event", "invitation", "rsvp"]
    },
    {
      id: 6,
      name: "Order Confirmation",
      category: "transactional",
      description: "Professional template for order confirmations",
      preview: "Clear, detailed layout for purchase confirmations",
      features: ["Order details", "Tracking info", "Support contact"],
      rating: 4.8,
      downloads: 980,
      lastUpdated: "4 days ago",
      difficulty: "beginner",
      tags: ["order", "confirmation", "transactional"]
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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
    switch (category) {
      case "newsletter":
        return "bg-blue-100 text-blue-800";
      case "promotional":
        return "bg-green-100 text-green-800";
      case "announcement":
        return "bg-purple-100 text-purple-800";
      case "welcome":
        return "bg-orange-100 text-orange-800";
      case "transactional":
        return "bg-gray-100 text-gray-800";
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
            <div className="flex items-center gap-2">
              <Grid size={24} className="text-yellow-600" />
              <h1 className="text-xl font-semibold text-gray-900">Template Gallery</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.count})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1 border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-yellow-400 text-black" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-yellow-400 text-black" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredTemplates.length} Templates Found
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>Updated regularly</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>Community rated</span>
            </div>
          </div>
        </div>

        {/* Templates Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-yellow-400 transition-all cursor-pointer"
              >
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <Mail size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Template Preview</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{template.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    {template.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      <span>{template.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download size={14} />
                      <span>{template.downloads.toLocaleString()}</span>
                    </div>
                    <span>Updated {template.lastUpdated}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="flex-1 bg-yellow-400 text-black py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors">
                      Use Template
                    </button>
                    <button className="p-2 text-gray-400 hover:text-yellow-600 transition-colors">
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-yellow-400 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-6">
                  <div className="w-32 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={24} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                        {template.difficulty}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-current" />
                        <span>{template.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download size={14} />
                        <span>{template.downloads.toLocaleString()} downloads</span>
                      </div>
                      <span>Updated {template.lastUpdated}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors">
                        Use Template
                      </button>
                      <button className="p-2 text-gray-400 hover:text-yellow-600 transition-colors">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse all templates.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
            >
              Show All Templates
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateGallery;
