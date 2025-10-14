import React, { useState } from "react";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Users, Mail, Eye, MousePointer, Clock, Target, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

const AnalyticsDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [selectedCampaign, setSelectedCampaign] = useState("all");

  const timeRanges = [
    { id: "7d", name: "Last 7 days" },
    { id: "30d", name: "Last 30 days" },
    { id: "90d", name: "Last 90 days" },
    { id: "1y", name: "Last year" }
  ];

  const campaigns = [
    { id: "all", name: "All Campaigns" },
    { id: "newsletter", name: "Weekly Newsletter" },
    { id: "promotional", name: "Promotional Emails" },
    { id: "welcome", name: "Welcome Series" }
  ];

  const overviewMetrics = [
    {
      title: "Total Subscribers",
      value: "12,547",
      change: "+5.2%",
      trend: "up",
      icon: <Users size={24} />,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Emails Sent",
      value: "45,230",
      change: "+12.8%",
      trend: "up",
      icon: <Mail size={24} />,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Open Rate",
      value: "24.3%",
      change: "+2.1%",
      trend: "up",
      icon: <Eye size={24} />,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Click Rate",
      value: "3.8%",
      change: "-0.5%",
      trend: "down",
      icon: <MousePointer size={24} />,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  const benchmarkData = [
    {
      metric: "Open Rate",
      yourValue: "24.3%",
      industryAvg: "18.2%",
      status: "above",
      description: "Your open rate is above the industry average for retail businesses"
    },
    {
      metric: "Click Rate",
      yourValue: "3.8%",
      industryAvg: "2.6%",
      status: "above",
      description: "Your click rate is performing well compared to industry standards"
    },
    {
      metric: "Unsubscribe Rate",
      yourValue: "0.8%",
      industryAvg: "0.5%",
      status: "below",
      description: "Your unsubscribe rate is slightly higher than the industry average"
    },
    {
      metric: "Bounce Rate",
      yourValue: "2.1%",
      industryAvg: "2.0%",
      status: "below",
      description: "Your bounce rate is within acceptable limits"
    }
  ];

  const recentCampaigns = [
    {
      id: 1,
      name: "Black Friday Sale",
      sent: "Dec 1, 2024",
      recipients: "8,450",
      openRate: "28.5%",
      clickRate: "4.2%",
      status: "completed"
    },
    {
      id: 2,
      name: "Weekly Newsletter #47",
      sent: "Nov 28, 2024",
      recipients: "12,547",
      openRate: "22.1%",
      clickRate: "3.1%",
      status: "completed"
    },
    {
      id: 3,
      name: "Product Launch Announcement",
      sent: "Nov 25, 2024",
      recipients: "12,200",
      openRate: "31.2%",
      clickRate: "5.8%",
      status: "completed"
    },
    {
      id: 4,
      name: "Holiday Gift Guide",
      sent: "Nov 22, 2024",
      recipients: "12,100",
      openRate: "26.7%",
      clickRate: "4.5%",
      status: "completed"
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case "above":
        return <CheckCircle size={16} className="text-green-500" />;
      case "below":
        return <AlertCircle size={16} className="text-yellow-500" />;
      case "completed":
        return <CheckCircle size={16} className="text-green-500" />;
      default:
        return <XCircle size={16} className="text-red-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "above":
        return "text-green-600";
      case "below":
        return "text-yellow-600";
      case "completed":
        return "text-green-600";
      default:
        return "text-red-600";
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
              <BarChart3 size={24} className="text-yellow-600" />
              <h1 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {timeRanges.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.name}
                </option>
              ))}
            </select>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overviewMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <div className={metric.color}>
                    {metric.icon}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {metric.trend === "up" ? (
                    <TrendingUp size={16} className="text-green-500" />
                  ) : (
                    <TrendingDown size={16} className="text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    metric.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}>
                    {metric.change}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
              <p className="text-gray-600 text-sm">{metric.title}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Performance Chart Placeholder */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Performance Trends</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={16} />
                  <span>Last updated 2 hours ago</span>
                </div>
              </div>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 size={48} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart visualization would go here</p>
                  <p className="text-sm text-gray-400">Connect to Chart.js for interactive charts</p>
                </div>
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Campaigns</h2>
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{campaign.name}</h3>
                      <p className="text-sm text-gray-500">Sent {campaign.sent} • {campaign.recipients} recipients</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{campaign.openRate}</p>
                        <p className="text-xs text-gray-500">Open Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{campaign.clickRate}</p>
                        <p className="text-xs text-gray-500">Click Rate</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(campaign.status)}
                        <span className={`text-sm font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Industry Benchmarks */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Target size={20} className="text-yellow-600" />
                <h2 className="text-lg font-semibold text-gray-900">Industry Benchmarks</h2>
              </div>
              <div className="space-y-4">
                {benchmarkData.map((benchmark, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{benchmark.metric}</h3>
                      {getStatusIcon(benchmark.status)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Your Rate:</span>
                        <span className="font-medium text-gray-900">{benchmark.yourValue}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Industry Avg:</span>
                        <span className="text-gray-500">{benchmark.industryAvg}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{benchmark.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 mt-6">
              <h3 className="text-lg font-semibold text-black mb-2">Need Help?</h3>
              <p className="text-black/80 text-sm mb-4">
                Get personalized advice on improving your email performance
              </p>
              <div className="space-y-2">
                <Link
                  to="/chat"
                  className="block bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors text-center"
                >
                  Ask AI Assistant
                </Link>
                <Link
                  to="/help-center"
                  className="block bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors text-center"
                >
                  Browse Help Center
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
