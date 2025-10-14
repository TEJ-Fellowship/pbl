import React, { useState } from "react";
import { ArrowLeft, Mail, Users, Eye, MousePointer, Save, Send, ArrowRight, CheckCircle, Clock, Target, Zap, Image, Type, Link2, Palette } from "lucide-react";
import { Link } from "react-router-dom";

const CampaignBuilder = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: "",
    subject: "",
    previewText: "",
    audience: "",
    template: "",
    content: "",
    sendTime: "",
    personalization: false
  });

  const steps = [
    { id: 1, title: "Campaign Details", icon: <Mail size={20} /> },
    { id: 2, title: "Choose Audience", icon: <Users size={20} /> },
    { id: 3, title: "Select Template", icon: <Image size={20} /> },
    { id: 4, title: "Design Content", icon: <Type size={20} /> },
    { id: 5, title: "Review & Send", icon: <Send size={20} /> }
  ];

  const audiences = [
    { id: "all", name: "All Subscribers", count: "12,547", description: "Send to your entire subscriber list" },
    { id: "active", name: "Active Subscribers", count: "8,230", description: "Subscribers who opened emails in the last 30 days" },
    { id: "new", name: "New Subscribers", count: "1,250", description: "Subscribers who joined in the last 7 days" },
    { id: "segment1", name: "Retail Customers", count: "3,450", description: "Customers who purchased retail products" },
    { id: "segment2", name: "Newsletter Readers", count: "5,670", description: "Subscribers who regularly read newsletters" }
  ];

  const templates = [
    {
      id: "newsletter",
      name: "Newsletter Template",
      category: "Newsletter",
      preview: "Clean, professional layout perfect for regular newsletters",
      features: ["Header with logo", "Multi-column layout", "Social media links", "Footer"]
    },
    {
      id: "promotional",
      name: "Promotional Template",
      category: "Marketing",
      preview: "Eye-catching design optimized for promotional content",
      features: ["Hero banner", "Product showcase", "Call-to-action buttons", "Discount codes"]
    },
    {
      id: "announcement",
      name: "Announcement Template",
      category: "Announcement",
      preview: "Simple, focused layout for important announcements",
      features: ["Large headline", "Single column", "Clear messaging", "Contact info"]
    },
    {
      id: "welcome",
      name: "Welcome Template",
      category: "Onboarding",
      preview: "Friendly template for welcoming new subscribers",
      features: ["Welcome message", "Getting started guide", "Resource links", "Personal touch"]
    }
  ];

  const handleInputChange = (field, value) => {
    setCampaignData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={campaignData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Black Friday Sale 2024"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Line *
              </label>
              <input
                type="text"
                value={campaignData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                placeholder="e.g., 🎉 Black Friday: Up to 50% Off Everything!"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Keep it under 50 characters for best mobile display
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview Text
              </label>
              <input
                type="text"
                value={campaignData.previewText}
                onChange={(e) => handleInputChange("previewText", e.target.value)}
                placeholder="e.g., Don't miss out on our biggest sale of the year!"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                This text appears in the email preview
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Audience</h3>
            {audiences.map((audience) => (
              <div
                key={audience.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  campaignData.audience === audience.id
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-200 hover:border-yellow-300"
                }`}
                onClick={() => handleInputChange("audience", audience.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{audience.name}</h4>
                    <p className="text-sm text-gray-600">{audience.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{audience.count}</p>
                    <p className="text-sm text-gray-500">subscribers</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Template</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    campaignData.template === template.id
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-gray-200 hover:border-yellow-300"
                  }`}
                  onClick={() => handleInputChange("template", template.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {template.category}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{template.preview}</p>
                  <div className="space-y-1">
                    {template.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-500">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Your Content</h3>
            <div className="bg-gray-100 rounded-lg p-6 min-h-[400px]">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="border-b pb-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{campaignData.subject || "Your Subject Line"}</h2>
                  <p className="text-gray-600">{campaignData.previewText || "Your preview text"}</p>
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                    <div className="text-center">
                      <Image size={32} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Template preview would go here</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Palette size={16} />
                    <span>Customize colors, fonts, and layout</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={campaignData.personalization}
                  onChange={(e) => handleInputChange("personalization", e.target.checked)}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="text-sm text-gray-700">Enable personalization (e.g., "Hi John!")</span>
              </label>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Send</h3>
            
            {/* Campaign Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Campaign Summary</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Campaign Name</p>
                  <p className="font-medium text-gray-900">{campaignData.name || "Untitled Campaign"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subject Line</p>
                  <p className="font-medium text-gray-900">{campaignData.subject || "No subject"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Audience</p>
                  <p className="font-medium text-gray-900">
                    {audiences.find(a => a.id === campaignData.audience)?.name || "Not selected"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Template</p>
                  <p className="font-medium text-gray-900">
                    {templates.find(t => t.id === campaignData.template)?.name || "Not selected"}
                  </p>
                </div>
              </div>
            </div>

            {/* Send Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Send Options</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={20} className="text-blue-500" />
                    <h5 className="font-medium text-gray-900">Send Now</h5>
                  </div>
                  <p className="text-sm text-gray-600">Send your campaign immediately</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={20} className="text-green-500" />
                    <h5 className="font-medium text-gray-900">Schedule Send</h5>
                  </div>
                  <p className="text-sm text-gray-600">Choose a specific date and time</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <button className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-medium hover:bg-yellow-500 transition-colors flex items-center gap-2">
                <Send size={20} />
                Send Campaign
              </button>
              <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2">
                <Save size={20} />
                Save as Draft
              </button>
            </div>
          </div>
        );

      default:
        return null;
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
              <Mail size={24} className="text-yellow-600" />
              <h1 className="text-xl font-semibold text-gray-900">Campaign Builder</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-600 hover:text-yellow-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Save size={18} />
            </button>
            <span className="text-sm text-gray-500">Step {currentStep} of {steps.length}</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    currentStep >= step.id
                      ? "bg-yellow-400 text-black"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {step.icon}
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight size={16} className="text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={16} />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / steps.length) * 100)}%
            </span>
          </div>

          <button
            onClick={nextStep}
            disabled={currentStep === steps.length}
            className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignBuilder;
