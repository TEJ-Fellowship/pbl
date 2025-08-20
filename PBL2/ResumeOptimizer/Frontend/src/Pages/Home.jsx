
import React, { useState } from "react";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
=======
import axios from "axios";
>>>>>>> 4d9aead0aeb372175ad52511f4c2a6fcb416007f

const Home = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadDate, setUploadDate] = useState(null);
<<<<<<< HEAD
  const [isDragging, setIsDragging] = useState(false);

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]; 

  // Validate file type
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
=======
>>>>>>> 4d9aead0aeb372175ad52511f4c2a6fcb416007f

  // File select via input
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadDate(new Date());
    }
  };

<<<<<<< HEAD
  // Drag & Drop
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

  // Upload to backend
  const handleUpload = async () => {
    if (!title || title.trim() === "") {
      alert("Please enter a title!");
      return;
    }

    if (!file) {
      alert("Please select a file before uploading!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("notes", notes);

      const response = await fetch("http://localhost:5000/api/resumes", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const confirmUpload = window.confirm(
          `File "${file.name}" uploaded successfully on ${uploadDate.toLocaleString()}`
        );
        if (confirmUpload) {
          navigate("/resume");
        }
      } else {
        alert("Error uploading resume! " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading resume! " + err.message);
=======
  const handleUpload = async () => {
    if (!title.trim()) {
      alert("Title is required!");
      return;
    }
    if (!file) {
      alert("Please select a PDF or DOCX file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("notes", notes);
    formData.append("uploadDate", uploadDate);

    try {
      const res = await axios.post("http://localhost:5000/api/resumes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Uploaded successfully!");
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("Upload failed!");
>>>>>>> 4d9aead0aeb372175ad52511f4c2a6fcb416007f
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-xl bg-white shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-semibold text-gray-800">Upload Resume</h1>

<<<<<<< HEAD
        {/* Resume Title */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">
            Resume Title*
          </label>
=======
        {/* Title */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Resume Title *</label>
>>>>>>> 4d9aead0aeb372175ad52511f4c2a6fcb416007f
          <input
            type="text"
            placeholder="e.g., Software Engineer Resume"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
          <textarea
            placeholder="Add any notes about this resume"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          ></textarea>
        </div>

<<<<<<< HEAD
        {/* File Upload Box */}
        <div className="mt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <p className="text-sm text-gray-500">
              Drag and drop your resume here, or
=======
        {/* File Upload */}
        <div className="mt-4">
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
          {file && (
            <p className="text-sm text-green-600 mt-2">
              Selected: {file.name} <br />
              Upload Date: {uploadDate?.toLocaleString()}
>>>>>>> 4d9aead0aeb372175ad52511f4c2a6fcb416007f
            </p>
          )}
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
