import React from "react";
import { motion } from "framer-motion";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Customers",
      value: "2,847",
      change: "+12%",
      changeType: "positive",
      icon: "people",
    },
    {
      title: "Active Tickets",
      value: "156",
      change: "-8%",
      changeType: "negative",
      icon: "support_agent",
    },
    {
      title: "Revenue",
      value: "$45,230",
      change: "+23%",
      changeType: "positive",
      icon: "attach_money",
    },
    {
      title: "Response Time",
      value: "2.4 min",
      change: "-15%",
      changeType: "positive",
      icon: "schedule",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "ticket",
      message: "New support ticket from customer #1234",
      time: "2 minutes ago",
      status: "new",
    },
    {
      id: 2,
      type: "payment",
      message: "Payment processed for $299.00",
      time: "5 minutes ago",
      status: "success",
    },
    {
      id: 3,
      type: "chat",
      message: "Chat session ended with customer #5678",
      time: "12 minutes ago",
      status: "completed",
    },
    {
      id: 4,
      type: "refund",
      message: "Refund processed for $150.00",
      time: "1 hour ago",
      status: "processed",
    },
  ];

  return (
    <div className="fixed left-[15%] right-0 h-screen bg-surface-dark overflow-y-auto">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-dark mb-2">Dashboard</h1>
          <p className="text-subtle-dark">
            Welcome back! Here's what's happening with your Stripe integration.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    {stat.icon}
                  </span>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stat.changeType === "positive"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-text-dark mb-1">
                {stat.value}
              </h3>
              <p className="text-subtle-dark text-sm">{stat.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-dark">
                Recent Activities
              </h2>
              <button className="text-primary hover:text-primary/80 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.status === "new"
                        ? "bg-blue-500/20"
                        : activity.status === "success"
                        ? "bg-green-500/20"
                        : activity.status === "completed"
                        ? "bg-purple-500/20"
                        : "bg-orange-500/20"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-sm ${
                        activity.status === "new"
                          ? "text-blue-400"
                          : activity.status === "success"
                          ? "text-green-400"
                          : activity.status === "completed"
                          ? "text-purple-400"
                          : "text-orange-400"
                      }`}
                    >
                      {activity.type === "ticket"
                        ? "support_agent"
                        : activity.type === "payment"
                        ? "payment"
                        : activity.type === "chat"
                        ? "chat"
                        : "money_off"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-text-dark text-sm">{activity.message}</p>
                    <p className="text-subtle-dark text-xs mt-1">
                      {activity.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50"
          >
            <h2 className="text-xl font-semibold text-text-dark mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: "New Chat",
                  icon: "chat",
                  color: "bg-blue-500/20 text-blue-400",
                },
                {
                  name: "View Tickets",
                  icon: "support_agent",
                  color: "bg-green-500/20 text-green-400",
                },
                {
                  name: "Add Customer",
                  icon: "person_add",
                  color: "bg-purple-500/20 text-purple-400",
                },
                {
                  name: "Analytics",
                  icon: "analytics",
                  color: "bg-orange-500/20 text-orange-400",
                },
              ].map((action, index) => (
                <motion.button
                  key={action.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-lg ${action.color} hover:opacity-80 transition-all`}
                >
                  <span className="material-symbols-outlined text-2xl mb-2 block">
                    {action.icon}
                  </span>
                  <p className="text-sm font-medium">{action.name}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50"
          >
            <h2 className="text-xl font-semibold text-text-dark mb-6">
              System Status
            </h2>
            <div className="space-y-4">
              {[
                {
                  name: "API Status",
                  status: "Online",
                  color: "text-green-400",
                },
                {
                  name: "Database",
                  status: "Healthy",
                  color: "text-green-400",
                },
                { name: "Webhooks", status: "Active", color: "text-green-400" },
                {
                  name: "Payments",
                  status: "Processing",
                  color: "text-yellow-400",
                },
              ].map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <span className="text-text-dark">{item.name}</span>
                  <span className={`text-sm font-medium ${item.color}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
