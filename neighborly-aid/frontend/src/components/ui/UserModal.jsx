import React, { useEffect, useState, useRef } from "react";
import {
  X,
  User,
  Settings,
  LogOut,
  Bell,
  Heart,
  HandHeart,
  Users,
  Star,
  TrendingUp,
  Award,
  Clock,
  MapPin,
  ShoppingCart,
  Car,
  Wrench,
  PawPrint,
  Trophy,
  CheckCircle,
  Sparkles,
  Zap,
} from "lucide-react";

import { useContext } from "react";
import AuthContext from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { LOGIN_ROUTE } from "../../constants/routes";
import { getUserDashboard } from "../../api/users";
import { getCategories } from "../../api/categories";

const UserModal = ({ isOpen = true, handleIsOpen = () => {} }) => {
  const { user, logout, refreshUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [categories, setCategories] = useState([]);
  const hasRefreshedUser = useRef(false);

  // Helper function for relative time
  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  // Helper function to get emoji based on category
  const getCategoryEmoji = (category) => {
    const emojis = {
      // Home & Maintenance
      "home-maintenance": "🏠",
      cleaning: "🧹",
      repairs: "🔧",
      gardening: "🌱",

      // Shopping & Delivery
      shopping: "🛍️",
      groceries: "🛒",
      delivery: "📦",

      // Transportation & Moving
      transportation: "🚗",
      moving: "📦",

      // Care Services
      "elderly-care": "👵",
      childcare: "👶",
      "pet-care": "🐾",

      // Education & Technology
      tutoring: "📚",
      technology: "💻",
      "tech-help": "🖥️",

      // Community & Events
      "event-help": "🎉",
      "community-service": "🤝",
      sports: "⚽",

      // Food & Cooking
      cooking: "👨‍🍳",

      // Default fallback
      default: "💝",
    };

    // Handle null/undefined category
    if (!category) return emojis.default;

    // Convert category to lowercase and remove spaces
    const normalizedCategory = category.toLowerCase().replace(/\s+/g, "-");

    // Return matching emoji or default
    return emojis[normalizedCategory] || emojis.default;
  };

  // Returns only tasks where the user was a helper
  const getHelpedTasks = (completedTasks, userId) => {
    if (!completedTasks) return [];
    return completedTasks.filter(task =>
      Array.isArray(task.helpers) &&
      task.helpers.some(h => h.userId?._id === userId || h.userId === userId)
    );
  };

  useEffect(() => {
    if (isOpen && user && !hasRefreshedUser.current) {
      // console.log("User object:", user);
      // console.log("User ID:", user.id);
      refreshUser(); // Refresh user data to get latest karma points
      fetchDashboardData(user.id);
      fetchCategories();
      hasRefreshedUser.current = true;
    }
  }, [isOpen, user?.id]); // Only depend on isOpen and user.id, not refreshUser

  // Reset the ref when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasRefreshedUser.current = false;
    }
  }, [isOpen]);

  const fetchDashboardData = async (userId) => {
    setLoading(true);
    // console.log("fetchDashboardData called with userId:", userId);

    try {
      const response = await getUserDashboard(userId);
      // console.log("response in fetchDashboardData:", response.data);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesResponse = await getCategories();
      setCategories(categoriesResponse);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      navigate(LOGIN_ROUTE, { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Please try again.");
    }
  };
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleIsOpen();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleIsOpen]);

  // Don't render anything if no user
  if (!user) {
    return null;
  }

  const helpedTasks = getHelpedTasks(dashboardData?.completedTasks, user?.id);

  const primaryStats = [
    {
      icon: HandHeart,
      label: "Tasks Completed",
      value: helpedTasks.length,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      gradient:
        "from-emerald-400 to-emerald-500 dark:from-emerald-600 dark:to-emerald-700",
    },
    {
      icon: Heart,
      label: "Total Likes",
      value: dashboardData?.totalLikes ?? 0,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-900/20",
      gradient: "from-rose-400 to-rose-500 dark:from-rose-600 dark:to-rose-700",
    },
    {
      icon: Star,
      label: "Total Reviews",
      value: dashboardData?.totalReviews ?? 0,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      gradient:
        "from-amber-400 to-amber-500 dark:from-amber-600 dark:to-amber-700",
    },
  ];

  // Simple helper to convert hex colors to Tailwind color classes
  const getColorClass = (hexColor) => {
    // Map common hex colors to Tailwind classes
    const colorMap = {
      '#3B82F6': 'blue-400',
      '#1D4ED8': 'blue-600',
      '#10B981': 'emerald-400',
      '#059669': 'emerald-600',
      '#F59E0B': 'amber-400',
      '#D97706': 'amber-600',
      '#EF4444': 'red-400',
      '#DC2626': 'red-600',
      '#8B5CF6': 'violet-400',
      '#7C3AED': 'violet-600',
      '#06B6D4': 'cyan-400',
      '#0891B2': 'cyan-600',
      '#F97316': 'orange-400',
      '#EA580C': 'orange-600',
      '#EC4899': 'pink-400',
      '#DB2777': 'pink-600',
      '#6B7280': 'gray-400', // Default
    };
    
    return colorMap[hexColor] || 'gray-400';
  };

  // Generate real category stats from completed tasks
  const categoryStats = React.useMemo(() => {
    if (!helpedTasks?.length || !categories.length) {
      return []; // Return empty array if no completed tasks or categories
    }

    // Create a map of category IDs to category objects for quick lookup
    const categoryMap = categories.reduce((acc, category) => {
      acc[category._id] = category;
      return acc;
    }, {});

    // Group tasks by category and count them
    const categoryCounts = helpedTasks.reduce((acc, task) => {
      // Handle both populated category objects and string categories
      const categoryData = task.category;
      let categoryId, categoryName, categoryIcon, categoryColor;
      
      if (typeof categoryData === 'object' && categoryData !== null) {
        // Populated category object
        categoryId = categoryData._id;
        categoryName = categoryData.displayName;
        categoryIcon = categoryData.icon;
        categoryColor = categoryData.color;
      } else {
        // String category (fallback) - look up in categoryMap
        categoryId = categoryData;
        const categoryInfo = categoryMap[categoryId];
        
        if (categoryInfo) {
          categoryName = categoryInfo.displayName;
          categoryIcon = categoryInfo.icon;
          categoryColor = categoryInfo.color;
        } else {
          categoryName = categoryId || 'Other';
          categoryIcon = '💝'; // Default emoji
          categoryColor = '#6B7280'; // Default gray
        }
      }
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          count: 1,
          categoryName,
          categoryIcon,
          categoryColor,
        };
      } else {
        acc[categoryId].count += 1;
      }
      
      return acc;
    }, {});

    // Convert to array and sort by count (highest first)
    const sortedCategories = Object.values(categoryCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Only show top 4 categories

    // Map to the format expected by the UI
    return sortedCategories.map(({ categoryName, categoryIcon, categoryColor, count }) => ({
      icon: categoryIcon || '💝', // Ensure we always have an icon
      label: categoryName,
      count: count,
      color: `from-${getColorClass(categoryColor)} to-${getColorClass(categoryColor)} dark:from-${getColorClass(categoryColor)} dark:to-${getColorClass(categoryColor)}`,
    }));
  }, [helpedTasks, categories]);

  // Update recentActivity to only show real data
  const recentActivity = React.useMemo(() => {
    if (!helpedTasks?.length || !categories.length) {
      return []; // Return empty array if no completed tasks or categories
    }

    // Create a map of category IDs to category objects for quick lookup
    const categoryMap = categories.reduce((acc, category) => {
      acc[category._id] = category;
      return acc;
    }, {});

    return helpedTasks
      .slice(0, 3) // Only show maximum 3 items
      .map((task) => {
        // Handle both populated category objects and string categories
        const categoryData = task.category;
        let categoryIcon;
        
        if (typeof categoryData === 'object' && categoryData !== null) {
          categoryIcon = categoryData.icon;
        } else {
          // Look up category in categoryMap
          const categoryInfo = categoryMap[categoryData];
          categoryIcon = categoryInfo?.icon || '💝'; // Default emoji
        }
        
        return {
          action: task.title,
          time: getRelativeTime(task.completedAt),
          emoji: categoryIcon || '💝', // Ensure we always have an emoji
          rating: task.rating || 0,
        };
      });
  }, [helpedTasks, categories]);

  return (
    <>
      {/* Only render if user exists and modal is open */}
      {user && isOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/15 dark:bg-black/50 z-50 transition-all duration-300 ${
              isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={handleIsOpen}
          />

          {/* Modal Container */}
          <div
            className={`fixed top-1 right-1 bottom-1 w-1/2 min-w-[550px] max-w-[650px] bg-blue-50 dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 transform transition-all duration-300 ease-out flex flex-col ${
              isOpen ? "translate-x-0 scale-100" : "translate-x-full scale-95"
            }`}
          >
            {/* Debug Info */}
            {loading && (
              <div className="absolute top-2 left-2 bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded text-xs dark:text-yellow-200">
                Loading dashboard data...
              </div>
            )}
            {dashboardData && (
              <div className="absolute top-2 right-2 bg-green-100 dark:bg-green-900/50 p-2 rounded text-xs dark:text-green-200">
                Data loaded: {JSON.stringify(dashboardData).substring(0, 50)}...
              </div>
            )}

            {/* Enhanced Header - Fixed at top with grassy/leafy background */}
            <div
              className="bg-green-500 dark:bg-green-700 p-6 text-white relative overflow-hidden rounded-t-2xl flex-shrink-0"
              style={{
                backgroundImage: `
                  url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
                `,
              }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-400 dark:bg-green-600 rounded-full -translate-y-12 translate-x-12 opacity-30"></div>
              <div className="absolute top-8 right-16 w-4 h-4 bg-green-300 dark:bg-green-500 rounded-full opacity-40"></div>
              <div className="absolute bottom-4 left-8 w-6 h-6 bg-green-400 dark:bg-green-600 rounded-full opacity-35"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-green-400 dark:bg-green-600 rounded-full translate-y-8 translate-x-8 opacity-25"></div>

              {/* Leaf-like decorative elements */}
              <div className="absolute top-2 left-1/4 w-8 h-4 bg-green-400 dark:bg-green-600 rounded-full transform -rotate-45 opacity-20"></div>
              <div className="absolute bottom-8 right-1/3 w-6 h-3 bg-green-300 dark:bg-green-500 rounded-full transform rotate-12 opacity-25"></div>

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-400 dark:bg-green-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  </div>
                  {/* {dashboardData.role && (
                    <h2 className="text-xl font-bold">{dashboardData.role}</h2>
                  )} */}
                </div>

                {/* Karma Points Display */}
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-400 dark:bg-yellow-500 border border-yellow-500 dark:border-yellow-600 rounded-full px-4 py-2 flex items-center space-x-2 shadow-lg hover:scale-105 transition-all duration-300 group cursor-pointer">
                    <div className="relative">
                      <Zap className="w-5 h-5 text-yellow-800 dark:text-yellow-100 group-hover:text-yellow-900 dark:group-hover:text-yellow-200 transition-colors duration-300" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 dark:bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-yellow-900 dark:text-yellow-100">
                        {dashboardData?.karmaPoints ?? 1000}
                      </div>
                      <div className="text-xs text-yellow-800 dark:text-yellow-200 -mt-1">
                        Karma
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-orange-400 dark:bg-orange-500 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <button
                    onClick={handleIsOpen}
                    className="p-2 hover:bg-green-400 dark:hover:bg-green-600 rounded-lg transition-all duration-200 hover:scale-110"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Compact User Info */}
              <div className="flex items-center space-x-4 relative z-10">
                <div className="relative">
                  <div className="w-16 h-16 bg-green-400 dark:bg-green-600 rounded-xl flex items-center justify-center border border-green-300 dark:border-green-500 shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-400 dark:bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {dashboardData?.name || user?.name || "User"}
                  </h3>
                  <p className="text-green-100">
                    {dashboardData?.badges || "Community Helper"}
                  </p>
                  <div className="flex items-center mt-1">
                    <MapPin className="w-3 h-3 text-green-200 mr-1" />
                    <span className="text-green-200 text-xs">
                      {dashboardData?.address || "Your neighborhood"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 dark:border-green-400 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-300">
                      Loading your dashboard...
                    </p>
                  </div>
                </div>
              ) : !dashboardData ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mb-2">
                      Unable to load dashboard data
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Please try again later
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-6">
                  {/* Primary Stats */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-emerald-500 dark:text-emerald-400" />
                      Your Stats
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {primaryStats.map((stat, index) => (
                        <div
                          key={index}
                          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 hover:scale-105 group"
                        >
                          <div
                            className={`w-10 h-10 bg-gradient-to-r ${stat.gradient} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                          >
                            <stat.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                            {stat.value}
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 text-sm">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                      Help Categories
                    </h3>
                    {categoryStats.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {categoryStats.map((category, index) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-9 h-9 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}
                                >
                                  <span className="text-lg">{category.icon}</span>
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                  {category.label}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                  {category.count}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  tasks
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-center">
                        <HandHeart className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-300 mb-2">
                          No completed tasks yet
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Start helping others to see your category breakdown here!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-sky-500 dark:text-sky-400" />
                      Recent Kindness
                    </h3>
                    {recentActivity.length > 0 ? (
                      <div className="space-y-3">
                        {recentActivity.map((activity, index) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  {activity.emoji}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                    {activity.action}
                                  </div>
                                  <div className="text-slate-500 dark:text-slate-400 text-xs">
                                    {activity.time}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < activity.rating
                                          ? "text-amber-400 dark:text-amber-500 fill-current"
                                          : "text-slate-300 dark:text-slate-600"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-center">
                        <Clock className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-300 mb-2">
                          No recent activity
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Complete some tasks to see your recent kindness here!
                        </p>
                      </div>
                    )}
                  </div>
{/* 
                  Quick Actions
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
                      Ready to Help?
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-emerald-400 to-emerald-500 dark:from-emerald-600 dark:to-emerald-700 text-white rounded-xl hover:from-emerald-500 hover:to-emerald-600 dark:hover:from-emerald-700 dark:hover:to-emerald-800 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 group">
                        <HandHeart className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-semibold">Offer Help</span>
                      </button>
                      <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-sky-400 to-sky-500 dark:from-sky-600 dark:to-sky-700 text-white rounded-xl hover:from-sky-500 hover:to-sky-600 dark:hover:from-sky-700 dark:hover:to-sky-800 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 group">
                        <Users className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-semibold">Find Help</span>
                      </button>
                    </div>
                  </div> */}

                  {/* Menu Items */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
                      Account
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="flex items-center space-x-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:shadow-md group">
                        <div className="w-9 h-9 bg-sky-100 dark:bg-sky-900/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <User className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
                          Edit Profile
                        </span>
                      </button>

                      <button className="flex items-center space-x-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:shadow-md group relative">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
                          Notifications
                        </span>
                        <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                          3
                        </div>
                      </button>

                      <button className="flex items-center space-x-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:shadow-md group">
                        <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
                          Settings
                        </span>
                      </button>

                      <button
                        className="flex items-center space-x-3 p-4 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all duration-300 border border-rose-200 dark:border-rose-800 hover:shadow-md group"
                        onClick={handleLogout}
                      >
                        <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <LogOut className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <span className="text-rose-600 dark:text-rose-400 font-semibold text-sm">
                          Sign Out
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default UserModal;
