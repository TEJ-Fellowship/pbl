import React, { useState } from "react";
import { motion } from "framer-motion";

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const customers = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@example.com",
      company: "TechCorp Inc.",
      status: "active",
      lastActivity: "2 hours ago",
      totalSpent: "$2,450.00",
      avatar: "JS",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@company.com",
      company: "StartupXYZ",
      status: "active",
      lastActivity: "1 day ago",
      totalSpent: "$890.00",
      avatar: "SJ",
    },
    {
      id: 3,
      name: "Mike Wilson",
      email: "mike.wilson@business.com",
      company: "Business Solutions",
      status: "inactive",
      lastActivity: "1 week ago",
      totalSpent: "$1,200.00",
      avatar: "MW",
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.davis@tech.com",
      company: "TechStart",
      status: "active",
      lastActivity: "3 hours ago",
      totalSpent: "$3,100.00",
      avatar: "ED",
    },
    {
      id: 5,
      name: "David Brown",
      email: "david.brown@enterprise.com",
      company: "Enterprise Corp",
      status: "pending",
      lastActivity: "5 minutes ago",
      totalSpent: "$0.00",
      avatar: "DB",
    },
  ];

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || customer.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "inactive":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="fixed left-[15%] right-0 h-screen bg-surface-dark overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-dark mb-2">
            Customer Management
          </h1>
          <p className="text-subtle-dark">
            Manage your customers and their Stripe integration status.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                type="text"
                placeholder="Search customers by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg pl-10 pr-4 py-3 text-text-dark placeholder-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {["all", "active", "inactive", "pending"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    filterStatus === status
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Customers",
              value: customers.length,
              icon: "people",
            },
            {
              label: "Active",
              value: customers.filter((c) => c.status === "active").length,
              icon: "check_circle",
            },
            {
              label: "Inactive",
              value: customers.filter((c) => c.status === "inactive").length,
              icon: "cancel",
            },
            {
              label: "Pending",
              value: customers.filter((c) => c.status === "pending").length,
              icon: "schedule",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-gray-800/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-text-dark">
                    {stat.value}
                  </p>
                  <p className="text-subtle-dark text-sm">{stat.label}</p>
                </div>
                <span className="material-symbols-outlined text-primary text-2xl">
                  {stat.icon}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Customer List */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-gray-800/50">
          <div className="p-6 border-b border-gray-800/50">
            <h2 className="text-xl font-semibold text-text-dark">
              Customer List
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-subtle-dark">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-subtle-dark">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-subtle-dark">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-subtle-dark">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-subtle-dark">
                    Last Activity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-subtle-dark">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {customer.avatar}
                          </span>
                        </div>
                        <div>
                          <p className="text-text-dark font-medium">
                            {customer.name}
                          </p>
                          <p className="text-subtle-dark text-sm">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-text-dark">{customer.company}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          customer.status
                        )}`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-text-dark font-medium">
                        {customer.totalSpent}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-subtle-dark text-sm">
                        {customer.lastActivity}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="p-2 text-primary hover:bg-primary/20 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-sm">
                            visibility
                          </span>
                        </button>
                        <button className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-sm">
                            edit
                          </span>
                        </button>
                        <button className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-sm">
                            chat
                          </span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
