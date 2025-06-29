import React, { useState } from "react";
import { useFileValidation } from "../../hooks/useFileValidation";
import { useResumeAnalysis } from "../../hooks/useResumeAnalysis";
import { resumeService } from "../../services/resumeService";

const ResumeUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const { validateFile, fileErrors } = useFileValidation();
  const { analyzeResume, analysisLoading, analysisError, analysisResult } =
    useResumeAnalysis();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const errors = validateFile(file);
      if (errors.length === 0) {
        setSelectedFile(file);
      } else {
        alert(errors.join("\n"));
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const errors = validateFile(file);
      if (errors.length === 0) {
        setSelectedFile(file);
      } else {
        alert(errors.join("\n"));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    setUploadProgress(0);
    setUploadedResume(null);

    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);

      const result = await resumeService.uploadResume(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      console.log("Upload successful:", result);
      console.log("Upload response data:", result.data);
      console.log("Resume ID from response:", result.data?.data?.id, typeof result.data?.data?.id);
      console.log("Full result object:", result);
      console.log("Result.data object:", result.data);
      console.log("Actual resume data:", result.data?.data);
      setUploadedResume(result.data.data);
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById("file-input");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploadProgress(0);
    }
  };

  const handleAnalyze = async () => {
    console.log("=== ANALYSIS DEBUG ===");
    console.log("Analyzing resume with ID:", uploadedResume?.id);
    console.log("Full uploadedResume object:", uploadedResume);
    console.log("Analysis loading state:", analysisLoading);
    console.log("Current analysis result:", analysisResult);
    console.log("Current analysis error:", analysisError);
    
    if (uploadedResume && uploadedResume.id) {
      try {
        console.log("Starting analysis...");
        const result = await analyzeResume(uploadedResume.id);
        console.log("Analysis completed successfully:", result);
        setShowAnalysis(true);
      } catch (error) {
        console.error("Analysis failed:", error);
        alert("Analysis failed: " + error.message);
      }
    } else {
      console.error("No valid resume ID found for analysis");
      alert("No valid resume ID found. Please upload again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Resume Analysis
          </h1>
          <p className="text-gray-600">
            Upload your PDF resume for AI-powered analysis and insights
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upload Resume
          </h2>

          {/* Progress Bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {fileErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              {fileErrors.map((error, index) => (
                <div key={index} className="text-red-700 text-sm">
                  {error}
                </div>
              ))}
            </div>
          )}

          {analysisError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-red-700 text-sm">
                Analysis Error: {analysisError}
              </div>
            </div>
          )}

          {/* File Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              dragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-gray-50 hover:border-gray-400"
            }`}
          >
            <div className="text-4xl mb-4">📄</div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              id="file-input"
              className="hidden"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-lg font-medium text-gray-900 mb-2">
                {selectedFile ? (
                  <>
                    <span className="text-green-600">✓</span> {selectedFile.name}
                  </>
                ) : (
                  "Click to upload or drag and drop"
                )}
              </div>
              <div className="text-sm text-gray-500">
                PDF files only (max 5MB)
              </div>
            </label>
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">File:</span>
                  <div className="text-gray-600">{selectedFile.name}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Size:</span>
                  <div className="text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <div className="text-gray-600">{selectedFile.type}</div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploadProgress > 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              {uploadProgress > 0 ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                "Upload Resume"
              )}
            </button>
          </div>
        </div>

        {/* Analysis Section */}
        {uploadedResume && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Resume Analysis
            </h2>
            
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <span className="text-green-600 text-lg mr-2">✓</span>
                <div>
                  <div className="font-medium text-green-800">
                    Resume uploaded successfully!
                  </div>
                  <div className="text-sm text-green-600">
                    {uploadedResume.originalName} • {(uploadedResume.fileSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analysisLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              {analysisLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                "Analyze Resume"
              )}
            </button>
          </div>
        )}

        {/* Analysis Results */}
        {showAnalysis && analysisResult && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Analysis Results
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skills */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Skills Found</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Experience Level</h3>
                <div className="text-2xl font-bold text-green-700">
                  {analysisResult.experienceLevel}
                </div>
              </div>

              {/* Strengths */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Key Strengths</h3>
                <ul className="space-y-1">
                  {analysisResult.strengths?.map((strength, index) => (
                    <li key={index} className="text-purple-800 text-sm flex items-center">
                      <span className="text-purple-600 mr-2">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">Suggestions</h3>
                <ul className="space-y-1">
                  {analysisResult.suggestions?.map((suggestion, index) => (
                    <li key={index} className="text-yellow-800 text-sm flex items-center">
                      <span className="text-yellow-600 mr-2">💡</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;