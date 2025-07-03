import React, { useState } from "react";
import { jobCustomizationService } from "../../services/jobCustomizationService";

const JobCustomization = ({ uploadedResume, onCustomizationComplete }) => {
  const [jobDetails, setJobDetails] = useState({
    company: "",
    jobTitle: "",
    role: "",
    industry: "",
    requirements: "",
  });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizedResume, setCustomizedResume] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [savedVersions, setSavedVersions] = useState([]);
  const [showSavedList, setShowSavedList] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomize = async () => {
    if (!uploadedResume || !jobDetails.company || !jobDetails.jobTitle) {
      alert("Please fill in company and job title");
      return;
    }

    setIsCustomizing(true);
    try {
      const result = await jobCustomizationService.customizeResume(
        uploadedResume.id,
        jobDetails
      );
      setCustomizedResume(result.data);
      setShowComparison(true);
    } catch (error) {
      console.error("Customization failed:", error);
      alert("Customization failed: " + error.message);
    } finally {
      setIsCustomizing(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!customizedResume) return;

    try {
      const savedVersion = await jobCustomizationService.saveCustomizedResume(
        uploadedResume.id,
        jobDetails,
        customizedResume
      );
      setSavedVersions(prev => [...prev, savedVersion.data]);
      alert("Customized resume saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save: " + error.message);
    }
  };

  const loadSavedVersions = async () => {
    try {
      const versions = await jobCustomizationService.getSavedVersions(uploadedResume.id);
      setSavedVersions(versions.data);
      setShowSavedList(true);
    } catch (error) {
      console.error("Failed to load saved versions:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Details Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Job Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              name="company"
              value={jobDetails.company}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Google, Microsoft"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="jobTitle"
              value={jobDetails.jobTitle}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Senior Software Engineer"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role/Position
            </label>
            <input
              type="text"
              name="role"
              value={jobDetails.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Full-stack Developer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              name="industry"
              value={jobDetails.industry}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Industry</option>
              <option value="technology">Technology</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="marketing">Marketing</option>
              <option value="consulting">Consulting</option>
              <option value="retail">Retail</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Requirements (Optional)
            </label>
            <textarea
              name="requirements"
              value={jobDetails.requirements}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste job description or requirements here for better customization..."
            />
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleCustomize}
            disabled={isCustomizing || !jobDetails.company || !jobDetails.jobTitle}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200 flex items-center"
          >
            {isCustomizing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Customizing...
              </>
            ) : (
              "Customize Resume"
            )}
          </button>
          <button
            onClick={loadSavedVersions}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200"
          >
            View Saved Versions
          </button>
        </div>
      </div>

      {/* Comparison View */}
      {showComparison && customizedResume && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Resume Comparison
            </h2>
            <button
              onClick={handleSaveVersion}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Save This Version
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Resume */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Original Resume</h3>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-96 overflow-y-auto">
                {uploadedResume.extractedText}
              </div>
            </div>

            {/* Customized Resume */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Customized for {jobDetails.company} - {jobDetails.jobTitle}
              </h3>
              <div className="bg-blue-50 p-3 rounded text-sm text-gray-700 max-h-96 overflow-y-auto">
                {customizedResume.customizedText}
              </div>
            </div>
          </div>

          {/* Customization Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Customization Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Keywords Added:</span>
                <div className="text-blue-700">{customizedResume.keywordsAdded?.length || 0}</div>
              </div>
              <div>
                <span className="font-medium text-blue-800">Sections Modified:</span>
                <div className="text-blue-700">{customizedResume.sectionsModified?.length || 0}</div>
              </div>
              <div>
                <span className="font-medium text-blue-800">Relevance Score:</span>
                <div className="text-blue-700">{customizedResume.relevanceScore || "N/A"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Versions List */}
      {showSavedList && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Saved Customized Versions
          </h2>
          {savedVersions.length === 0 ? (
            <p className="text-gray-500">No saved versions yet.</p>
          ) : (
            <div className="space-y-3">
              {savedVersions.map((version, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {version.jobTitle}
                      </h3>
                      <p className="text-gray-600">{version.company}</p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(version.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        View
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobCustomization; 