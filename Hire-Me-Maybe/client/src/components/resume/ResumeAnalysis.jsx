import React from "react";
// import './ResumeAnalysis.css';

const ResumeAnalysis = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Analysis Results
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Skills Found</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.skills?.map((skill, index) => (
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
            {analysis.experienceLevel}
          </div>
        </div>

        {/* Strengths */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">Key Strengths</h3>
          <ul className="space-y-1">
            {analysis.strengths?.map((strength, index) => (
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
            {analysis.suggestions?.map((suggestion, index) => (
              <li key={index} className="text-yellow-800 text-sm flex items-center">
                <span className="text-yellow-600 mr-2">💡</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Analysis Date */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Analysis completed on{" "}
          {new Date(analysis.analysisDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysis;