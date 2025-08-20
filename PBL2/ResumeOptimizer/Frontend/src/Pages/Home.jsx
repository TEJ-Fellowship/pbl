
import React, { useState } from "react";
import axios from "axios";

const Home = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadDate, setUploadDate] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadDate(new Date());
    }
  };

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
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-xl bg-white shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-semibold text-gray-800">Upload Resume</h1>

        {/* Title */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Resume Title *</label>
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

        {/* File Upload */}
        <div className="mt-4">
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
          {file && (
            <p className="text-sm text-green-600 mt-2">
              Selected: {file.name} <br />
              Upload Date: {uploadDate?.toLocaleString()}
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
