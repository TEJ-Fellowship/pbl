import React, { useState } from "react";
import { useFileValidation } from "../../hooks/useFileValidation";
import { useResumeAnalysis } from "../../hooks/useResumeAnalysis";
import { resumeService } from "../../services/resumeService";
import ProgressBar from "../common/ProgressBar";
import ResumePreview from "./ResumePreview";
import ResumeAnalysis from "./ResumeAnalysis";

const ResumeUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
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
      setUploadedResume(result.data);
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
    if (uploadedResume) {
      await analyzeResume(uploadedResume.id);
      setShowAnalysis(true);
    }
  };

  return (
    <div>
      <div>
        <h2>Upload Your Resume</h2>
        <p>Upload your PDF resume for AI analysis</p>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <ProgressBar progress={uploadProgress} status="Uploading resume..." />
        )}

        {fileErrors.length > 0 && (
          <div>
            {fileErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}

        {analysisError && (
          <div style={{ color: "red", marginBottom: "10px" }}>
            Analysis Error: {analysisError}
          </div>
        )}

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: dragActive ? "2px dashed #4CAF50" : "2px dashed #ccc",
            backgroundColor: dragActive ? "#f0f8f0" : "#f9f9f9",
            padding: "20px",
            textAlign: "center",
            transition: "all 0.3s ease",
          }}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            id="file-input"
          />
          <label htmlFor="file-input">
            <div>📄</div>
            <div>
              {selectedFile ? (
                <>
                  <strong>Selected:</strong> {selectedFile.name}
                </>
              ) : (
                <>
                  <strong>Click to upload</strong> or drag and drop
                  <br />
                  <span>PDF files only (max 5MB)</span>
                </>
              )}
            </div>
          </label>
        </div>

        {selectedFile && (
          <div>
            <p>
              <strong>File:</strong> {selectedFile.name}
            </p>
            <p>
              <strong>Size:</strong>{" "}
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p>
              <strong>Type:</strong> {selectedFile.type}
            </p>
          </div>
        )}

        <div>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadProgress > 0}
          >
            {uploadProgress > 0 ? "Uploading..." : "Upload Resume"}
          </button>

          {uploadedResume && (
            <>
              <button onClick={() => setShowPreview(true)}>
                Preview Resume
              </button>
              <button onClick={handleAnalyze} disabled={analysisLoading}>
                {analysisLoading ? "Analyzing..." : "Analyze Resume"}
              </button>
            </>
          )}
        </div>

        {uploadedResume && showAnalysis && analysisResult && (
          <ResumeAnalysis analysis={analysisResult} />
        )}
      </div>

      {showPreview && uploadedResume && (
        <ResumePreview
          extractedText={uploadedResume.extractedText}
          fileName={uploadedResume.originalName}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default ResumeUpload;
