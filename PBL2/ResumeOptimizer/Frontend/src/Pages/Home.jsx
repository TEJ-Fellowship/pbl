import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/axios";
import { Upload, FileText } from "lucide-react"; // ✅ nice icons

const Home = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const validateFile = (selectedFile) => {
    if (!allowedTypes.includes(selectedFile.type)) {
      alert("Please select PDF or DOCX files only!");
      setFile(null);
      return false;
    }
    setFile(selectedFile);
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

  const handleDragLeave = () => setIsDragging(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF or DOCX file!");
    if (!title.trim()) return alert("Please enter a title!");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("notes", notes);

    try {
      await API.post("/resumes/upload", formData);
      alert(`File "${file.name}" uploaded successfully!`);

      setFile(null);
      setTitle("");
      setNotes("");

      navigate("/resume");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading resume: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-blue-50 px-4">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-10 transition-all hover:shadow-xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 tracking-wide">
            Upload Your Resume
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            We support <span className="text-blue-600 font-medium">PDF</span> and{" "}
            <span className="text-blue-600 font-medium">DOCX</span> formats.
          </p>
        </div>

        {/* Title */}
        <div className="mt-8">
          <label className="block text-sm font-medium text-gray-700">
            Resume Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Software Engineer Resume"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        {/* Notes */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">
            Notes (Optional)
          </label>
          <textarea
            placeholder="Add any notes about this resume"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            rows={3}
          />
        </div>

        {/* File Dropzone */}
        <div
          className={`mt-8 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="mx-auto h-10 w-10 text-blue-500" />
          <p className="mt-2 text-gray-600 text-sm">
            Drag & drop your resume here
          </p>
          <label className="mt-3 inline-block px-5 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 hover:scale-[1.02] transition-all text-sm font-medium">
            Select File
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {file && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-green-600">
              <FileText className="w-4 h-4" />
              <span>{file.name}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={() => navigate("/resume")}
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 hover:scale-[1.02] transition-all"
          >
            See Previous Resumes
          </button>

          <button
            onClick={handleUpload}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
