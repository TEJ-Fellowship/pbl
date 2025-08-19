import React, { useState } from "react";

const Home = () => {
  const [file, setFile] = useState(null);
  const [uploadDate, setUploadDate] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const validateFile = (selectedFile) => {
    if (!allowedTypes.includes(selectedFile.type)) {
      alert("Please select PDF or DOCX files only!");
      setFile(null);
      setUploadDate(null);
      return false;
    }
    setFile(selectedFile);
    setUploadDate(new Date());
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) validateFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = () => {
    if (!file) {
      alert("Please select a file before uploading!");
      return;
    }
    alert(
      `File "${file.name}" uploaded successfully on ${uploadDate.toLocaleString()}`
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-xl bg-white shadow-md rounded-lg p-8">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-gray-800">Upload Resume</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload your resume to get started.{" "}
          <span className="text-blue-500">We support PDF and DOCX formats.</span>
        </p>

        {/* Resume Title */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">
            Resume Title
          </label>
          <input
            type="text"
            placeholder="e.g., Software Engineer Resume"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Notes (Optional)
          </label>
          <textarea
            placeholder="Add any notes about this resume"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          ></textarea>
        </div>

        {/* File Upload Box */}
        <div className="mt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <p className="text-sm text-gray-500">
              Drag and drop your resume here, or
            </p>
            <label className="mt-2 inline-block px-4 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200 text-sm font-medium">
              Select File
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <p className="text-xs text-gray-400 mt-1">PDF or DOCX files only</p>
            {file && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                <p>Selected File: {file.name}</p>
                <p>
                  Upload Date:{" "}
                  <span className="text-gray-700">
                    {uploadDate?.toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleUpload}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
