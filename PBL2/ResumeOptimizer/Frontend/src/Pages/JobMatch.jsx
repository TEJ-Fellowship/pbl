import React, { useState } from "react";

const JobMatch = () => {
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = () => {
    setShowResults(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-md rounded-xl max-w-2xl w-full p-8">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Match Resume to Job Description
        </h1>
        <p className="text-gray-600 mb-6">
          Paste the job description below to see how well your resume aligns
          with the requirements.
        </p>

        {/* Textarea */}
        <textarea
          placeholder="Paste job description here..."
          className="w-full h-32 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
        />

        {/* Button */}
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Match Resume
        </button>

        {/* Conditional Rendering */}
        {showResults && (
          <div className="mt-8 border-t pt-6">
            {/* Resume Match Score */}
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Matching Results
            </h2>

            <p className="text-gray-600 mb-2">Resume Match Score</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div
                className="bg-blue-600 h-3 rounded-full"
                style={{ width: "75%" }}
              ></div>
            </div>
            <p className="text-blue-600 text-sm mb-4">
              Your resume aligns well with the job description. (75%)
            </p>

            {/* Key Strengths */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-1">Key Strengths</h3>
              <p className="text-gray-600 text-sm">
                Your resume effectively highlights your skills in project
                management, team leadership, and strategic planning, which are
                highly relevant to the job requirements.
              </p>
            </div>

            {/* Missing Keywords */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">
                Missing Keywords
              </h3>
              <p className="text-gray-600 text-sm">
                Consider adding keywords related to data analysis, client
                communication, and budget management to better match the job
                description.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobMatch;
