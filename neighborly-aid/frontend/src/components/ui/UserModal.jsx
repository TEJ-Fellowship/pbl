import React, { useEffect, useState } from "react";
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

const UserModal = ({ isOpen = true, handleIsOpen = () => {} }) => {
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      console.log("User object:", user);
      console.log("User ID:", user.id);
      fetchDashboardData(user.id);
    }
  }, [isOpen, user]);

  const fetchDashboardData = async (userId) => {
    setLoading(true);
    console.log("fetchDashboardData called with userId:", userId);

    try {
      const response = await getUserDashboard(userId);
      console.log("response in fetchDashboardData:", response.data);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      setDashboardData(null);
    } finally {
      setLoading(false);
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

  const primaryStats = [
    {
      icon: HandHeart,
      label: "Tasks Completed",
      value: "127",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      gradient: "from-emerald-400 to-emerald-500",
    },
    {
      icon: Heart,
      label: "People Helped",
      value: "89",
      color: "text-rose-600",
      bg: "bg-rose-50",
      gradient: "from-rose-400 to-rose-500",
    },
    {
      icon: Star,
      label: "Average Rating",
      value: "4.9",
      color: "text-amber-600",
      bg: "bg-amber-50",
      gradient: "from-amber-400 to-amber-500",
    },
  ];

  const categoryStats = [
    {
      icon: ShoppingCart,
      label: "Groceries",
      count: 45,
      color: "from-sky-400 to-sky-500",
    },
    {
      icon: Car,
      label: "Transport",
      count: 28,
      color: "from-indigo-400 to-indigo-500",
    },
    {
      icon: Wrench,
      label: "Tech Help",
      count: 23,
      color: "from-orange-400 to-orange-500",
    },
    {
      icon: PawPrint,
      label: "Pet Care",
      count: 18,
      color: "from-rose-400 to-rose-500",
    },
  ];

  const recentActivity = [
    {
      action: "Helped Sarah with grocery shopping",
      time: "2 hours ago",
      emoji: "🛒",
      rating: 5,
    },
    {
      action: "Dog walking for Mike",
      time: "1 day ago",
      emoji: "🐕",
      rating: 5,
    },
    {
      action: "Tech support for Emma",
      time: "3 days ago",
      emoji: "💻",
      rating: 4,
    },
  ];

  return (
    <>
      {/* Only render if user exists and modal is open */}
      {user && isOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/15 z-50 transition-all duration-300 ${
              isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={handleIsOpen}
          />

          {/* Modal Container */}
          <div
            className={`fixed top-1 right-1 bottom-1 w-1/2 min-w-[550px] max-w-[650px] bg-blue-50 rounded-2xl shadow-xl border border-slate-200 z-50 transform transition-all duration-300 ease-out flex flex-col ${
              isOpen ? "translate-x-0 scale-100" : "translate-x-full scale-95"
            }`}
          >
            {/* Debug Info */}
            {loading && (
              <div className="absolute top-2 left-2 bg-yellow-100 p-2 rounded text-xs">
                Loading dashboard data...
              </div>
            )}
            {dashboardData && (
              <div className="absolute top-2 right-2 bg-green-100 p-2 rounded text-xs">
                Data loaded: {JSON.stringify(dashboardData).substring(0, 50)}...
              </div>
            )}

            {/* Enhanced Header - Fixed at top with grassy/leafy background */}
            <div
              className="bg-green-500 p-6 text-white relative overflow-hidden rounded-t-2xl flex-shrink-0"
              style={{
                backgroundImage: `
                  url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
                `,
              }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-400 rounded-full -translate-y-12 translate-x-12 opacity-30"></div>
              <div className="absolute top-8 right-16 w-4 h-4 bg-green-300 rounded-full opacity-40"></div>
              <div className="absolute bottom-4 left-8 w-6 h-6 bg-green-400 rounded-full opacity-35"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-green-400 rounded-full translate-y-8 translate-x-8 opacity-25"></div>

              {/* Leaf-like decorative elements */}
              <div className="absolute top-2 left-1/4 w-8 h-4 bg-green-400 rounded-full transform -rotate-45 opacity-20"></div>
              <div className="absolute bottom-8 right-1/3 w-6 h-3 bg-green-300 rounded-full transform rotate-12 opacity-25"></div>

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  </div>
                  {/* {dashboardData.role && (
                    <h2 className="text-xl font-bold">{dashboardData.role}</h2>
                  )} */}
                </div>

                {/* Karma Points Display */}
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-400 border border-yellow-500 rounded-full px-4 py-2 flex items-center space-x-2 shadow-lg hover:scale-105 transition-all duration-300 group cursor-pointer">
                    <div className="relative">
                      <Zap className="w-5 h-5 text-yellow-800 group-hover:text-yellow-900 transition-colors duration-300" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-yellow-900">
                        {dashboardData?.karmaPoints || 0}
                      </div>
                      <div className="text-xs text-yellow-800 -mt-1">Karma</div>
                    </div>
                    <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <button
                    onClick={handleIsOpen}
                    className="p-2 hover:bg-green-400 rounded-lg transition-all duration-200 hover:scale-110"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Compact User Info */}
              <div className="flex items-center space-x-4 relative z-10">
                <div className="relative">
                  <div className="w-16 h-16 bg-green-400 rounded-xl flex items-center justify-center border border-green-300 shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {dashboardData?.name || user?.name || "User"}
                  </h3>
                  <p className="text-green-100 text-sm">
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading your dashboard...</p>
                  </div>
                </div>
              ) : !dashboardData ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 mb-2">
                      Unable to load dashboard data
                    </p>
                    <p className="text-slate-500 text-sm">
                      Please try again later
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-6">
                  {/* Primary Stats */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
                      Your Stats
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {primaryStats.map((stat, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-300 hover:scale-105 group"
                        >
                          <div
                            className={`w-10 h-10 bg-gradient-to-r ${stat.gradient} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                          >
                            <stat.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-2xl font-bold text-slate-800 mb-1">
                            {stat.value}
                          </div>
                          <div className="text-slate-600 text-sm">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-indigo-500" />
                      Help Categories
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {categoryStats.map((category, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-300 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-9 h-9 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}
                              >
                                <category.icon className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-semibold text-slate-800 text-sm">
                                {category.label}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-slate-800">
                                {category.count}
                              </div>
                              <div className="text-xs text-slate-500">
                                tasks
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-sky-500" />
                      Recent Kindness
                    </h3>
                    <div className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-300 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                {activity.emoji}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800 text-sm">
                                  {activity.action}
                                </div>
                                <div className="text-slate-500 text-xs">
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
                                        ? "text-amber-400 fill-current"
                                        : "text-slate-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">
                      Ready to Help?
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white rounded-xl hover:from-emerald-500 hover:to-emerald-600 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 group">
                        <HandHeart className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-semibold">Offer Help</span>
                      </button>
                      <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-sky-400 to-sky-500 text-white rounded-xl hover:from-sky-500 hover:to-sky-600 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 group">
                        <Users className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-semibold">Find Help</span>
                      </button>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">
                      Account
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="flex items-center space-x-3 p-4 hover:bg-slate-50 rounded-xl transition-all duration-300 border border-slate-200 hover:shadow-md group">
                        <div className="w-9 h-9 bg-sky-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <User className="w-5 h-5 text-sky-600" />
                        </div>
                        <span className="text-slate-700 font-semibold text-sm">
                          Edit Profile
                        </span>
                      </button>

                      <button className="flex items-center space-x-3 p-4 hover:bg-slate-50 rounded-xl transition-all duration-300 border border-slate-200 hover:shadow-md group relative">
                        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Bell className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span className="text-slate-700 font-semibold text-sm">
                          Notifications
                        </span>
                        <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                          3
                        </div>
                      </button>

                      <button className="flex items-center space-x-3 p-4 hover:bg-slate-50 rounded-xl transition-all duration-300 border border-slate-200 hover:shadow-md group">
                        <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Settings className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="text-slate-700 font-semibold text-sm">
                          Settings
                        </span>
                      </button>

                      <button
                        className="flex items-center space-x-3 p-4 hover:bg-rose-50 rounded-xl transition-all duration-300 border border-rose-200 hover:shadow-md group"
                        onClick={handleLogout}
                      >
                        <div className="w-9 h-9 bg-rose-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <LogOut className="w-5 h-5 text-rose-600" />
                        </div>
                        <span className="text-rose-600 font-semibold text-sm">
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
