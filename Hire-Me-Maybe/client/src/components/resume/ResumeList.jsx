import React, { useState, useEffect } from "react";
import { resumeService } from "../../services/resumeService";
import { jobCustomizationService } from "../../services/jobCustomizationService";
import { toast } from "react-toastify";

const ResumeList = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState(null);
  const [showVersions, setShowVersions] = useState({});

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const response = await resumeService.getResumes();
      setResumes(response.data.data || []);
    } catch (error) {
      console.error("Failed to load resumes:", error);
      toast.error("Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) {
      return;
    }

    try {
      await resumeService.deleteResume(resumeId);
      toast.success("Resume deleted successfully");
      loadResumes(); // Reload the list
    } catch (error) {
      console.error("Failed to delete resume:", error);
      toast.error("Failed to delete resume");
    }
  };

  const handleAnalyzeResume = async (resumeId) => {
    try {
      await resumeService.analyzeResume(resumeId);
      toast.success("Resume analysis completed");
      loadResumes(); // Reload to get updated analysis
    } catch (error) {
      console.error("Failed to analyze resume:", error);
      toast.error("Failed to analyze resume");
    }
  };

  const toggleVersions = (resumeId) => {
    setShowVersions(prev => ({
      ...prev,
      [resumeId]: !prev[resumeId]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading resumes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Resumes</h1>
          <p className="text-gray-600">Manage and customize your uploaded resumes</p>
        </div>

        {/* Resume List */}
        {resumes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
            <p className="text-gray-600 mb-4">Upload your first resume to get started</p>
            <a
              href="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Upload Resume
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {resumes.map((resume) => (
              <div key={resume._id} className="bg-white rounded-lg shadow-md p-6">
                {/* Resume Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{resume.originalName}</h3>
                      <p className="text-sm text-gray-600">
                        Uploaded {formatDate(resume.uploadDate)} • {formatFileSize(resume.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      resume.isAnalyzed
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {resume.isAnalyzed ? "Analyzed" : "Not Analyzed"}
                    </span>
                  </div>
                </div>

                {/* Resume Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Word Count:</span>
                    <span className="ml-2 text-gray-600">{resume.wordCount || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Versions:</span>
                    <span className="ml-2 text-gray-600">{resume.versions?.length || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2 text-gray-600 capitalize">{resume.status}</span>
                  </div>
                </div>

                {/* Analysis Results */}
                {resume.isAnalyzed && resume.analysisResult && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Analysis Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {resume.analysisResult.skills?.slice(0, 5).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Score:</span>
                        <span className="ml-2 text-gray-600">{resume.analysisResult.score}/100</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => handleAnalyzeResume(resume._id)}
                    disabled={resume.isAnalyzed}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    {resume.isAnalyzed ? "Already Analyzed" : "Analyze Resume"}
                  </button>
                  
                  <button
                    onClick={() => toggleVersions(resume._id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    {showVersions[resume._id] ? "Hide Versions" : "View Versions"}
                  </button>
                  
                  <a
                    href={`/upload?resumeId=${resume._id}`}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Customize
                  </a>
                  
                  <button
                    onClick={() => handleDeleteResume(resume._id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>

                {/* Versions Section */}
                {showVersions[resume._id] && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Customized Versions</h4>
                    {resume.versions && resume.versions.length > 0 ? (
                      <div className="space-y-3">
                        {resume.versions.map((version, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900">{version.versionName}</h5>
                              <span className="text-xs text-gray-500">
                                {formatDate(version.createdAt)}
                              </span>
                            </div>
                            {version.jobDetails && (
                              <div className="text-sm text-gray-600">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-medium">Company:</span> {version.jobDetails.company}
                                  </div>
                                  <div>
                                    <span className="font-medium">Position:</span> {version.jobDetails.jobTitle}
                                  </div>
                                  {version.jobDetails.location && (
                                    <div>
                                      <span className="font-medium">Location:</span> {version.jobDetails.location}
                                    </div>
                                  )}
                                  {version.jobDetails.industry && (
                                    <div>
                                      <span className="font-medium">Industry:</span> {version.jobDetails.industry}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="mt-2">
                              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                View Customized Content
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No customized versions yet. Create one by clicking "Customize".</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeList; 