import React, { useState } from "react";
import { ArrowLeft, Zap, Plus, Settings, Play, Pause, Trash2, Edit, Copy, ArrowRight, Users, Mail, Clock, Target, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const AutomationWorkflow = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const workflowTemplates = [
    {
      id: "welcome-series",
      name: "Welcome Series",
      description: "Automatically welcome new subscribers with a series of emails",
      trigger: "New subscriber joins",
      emails: 3,
      duration: "7 days",
      status: "active",
      subscribers: 1250,
      openRate: "28.5%",
      clickRate: "4.2%"
    },
    {
      id: "abandoned-cart",
      name: "Abandoned Cart Recovery",
      description: "Remind customers about items left in their cart",
      trigger: "Cart abandoned",
      emails: 3,
      duration: "5 days",
      status: "active",
      subscribers: 890,
      openRate: "32.1%",
      clickRate: "6.8%"
    },
    {
      id: "birthday-campaign",
      name: "Birthday Campaign",
      description: "Send special offers on subscriber birthdays",
      trigger: "Birthday date",
      emails: 1,
      duration: "1 day",
      status: "paused",
      subscribers: 2100,
      openRate: "45.2%",
      clickRate: "8.9%"
    },
    {
      id: "re-engagement",
      name: "Re-engagement Campaign",
      description: "Win back inactive subscribers",
      trigger: "No opens for 90 days",
      emails: 2,
      duration: "14 days",
      status: "draft",
      subscribers: 0,
      openRate: "0%",
      clickRate: "0%"
    }
  ];

  const automationSteps = [
    {
      id: 1,
      type: "trigger",
      title: "Trigger",
      description: "When someone subscribes to your list",
      icon: <Target size={20} />,
      color: "bg-blue-100 text-blue-600"
    },
    {
      id: 2,
      type: "delay",
      title: "Wait 1 day",
      description: "Delay before sending next email",
      icon: <Clock size={20} />,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      id: 3,
      type: "email",
      title: "Send Welcome Email",
      description: "Welcome new subscriber with introduction",
      icon: <Mail size={20} />,
      color: "bg-green-100 text-green-600"
    },
    {
      id: 4,
      type: "condition",
      title: "Check if opened",
      description: "Only continue if email was opened",
      icon: <CheckCircle size={20} />,
      color: "bg-purple-100 text-purple-600"
    },
    {
      id: 5,
      type: "delay",
      title: "Wait 3 days",
      description: "Delay before sending next email",
      icon: <Clock size={20} />,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      id: 6,
      type: "email",
      title: "Send Product Guide",
      description: "Introduce key products and features",
      icon: <Mail size={20} />,
      color: "bg-green-100 text-green-600"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <Play size={16} className="text-green-600" />;
      case "paused":
        return <Pause size={16} className="text-yellow-600" />;
      case "draft":
        return <Edit size={16} className="text-gray-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
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
              <Zap size={24} className="text-yellow-600" />
              <h1 className="text-xl font-semibold text-gray-900">Automation Workflows</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Create Workflow
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap size={20} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Total Workflows</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">4</p>
            <p className="text-sm text-gray-500">3 active, 1 paused</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users size={20} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Active Subscribers</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">4,240</p>
            <p className="text-sm text-gray-500">Across all workflows</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail size={20} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Emails Sent</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">12,850</p>
            <p className="text-sm text-gray-500">This month</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target size={20} className="text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Avg. Open Rate</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">35.2%</p>
            <p className="text-sm text-gray-500">Above industry average</p>
          </div>
        </div>

        {/* Workflow Templates */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Workflows</h2>
            <div className="flex items-center gap-2">
              <button className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {workflowTemplates.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-yellow-400 transition-all cursor-pointer"
                onClick={() => setSelectedWorkflow(workflow)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                        {workflow.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{workflow.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Trigger</p>
                        <p className="font-medium text-gray-900">{workflow.trigger}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Emails</p>
                        <p className="font-medium text-gray-900">{workflow.emails} emails</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium text-gray-900">{workflow.duration}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Subscribers</p>
                        <p className="font-medium text-gray-900">{workflow.subscribers.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {getStatusIcon(workflow.status)}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <span>Open: {workflow.openRate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Click: {workflow.clickRate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-yellow-600 transition-colors">
                      <Edit size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-yellow-600 transition-colors">
                      <Copy size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Builder */}
        {selectedWorkflow && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedWorkflow.name}</h2>
                <p className="text-gray-600">{selectedWorkflow.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors">
                  <Play size={18} />
                </button>
                <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                  <Settings size={18} />
                </button>
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Workflow Steps</h3>
              {automationSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-white flex-1">
                    <div className={`p-2 rounded-lg ${step.color}`}>
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-yellow-600 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {index < automationSteps.length - 1 && (
                    <div className="mx-4 flex items-center justify-center">
                      <ArrowRight size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Step Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-yellow-400 hover:text-yellow-600 transition-colors flex items-center justify-center gap-2">
                <Plus size={20} />
                Add Step
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-black mb-2">Need Help Building Workflows?</h2>
          <p className="text-black/80 mb-6">Our AI assistant can help you create effective automation sequences</p>
          <div className="flex justify-center gap-4">
            <Link
              to="/chat"
              className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Get AI Help
            </Link>
            <Link
              to="/help-center"
              className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              View Automation Guides
            </Link>
          </div>
        </div>
      </div>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Workflow</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Welcome Series"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Event
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
                  <option>New subscriber joins</option>
                  <option>Cart abandoned</option>
                  <option>Birthday date</option>
                  <option>No opens for X days</option>
                  <option>Custom trigger</option>
                </select>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
                >
                  Create Workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationWorkflow;
