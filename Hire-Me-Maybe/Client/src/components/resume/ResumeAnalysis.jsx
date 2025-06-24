import React from "react";
// import './ResumeAnalysis.css';

const ResumeAnalysis = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div>
      <h3>AI Analysis Results</h3>

      <div>
        <h4>Skills Detected</h4>
        <div>
          {analysis.skills?.map((skill, index) => (
            <span key={index}>{skill}</span>
          ))}
        </div>
      </div>

      <div>
        <h4>Experience Level</h4>
        <div>
          <span>{analysis.experienceLevel}</span>
        </div>
      </div>

      <div>
        <h4>Key Strengths</h4>
        <ul>
          {analysis.strengths?.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4>Suggestions for Improvement</h4>
        <ul>
          {analysis.suggestions?.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      </div>

      <div>
        <small>
          Analysis completed on{" "}
          {new Date(analysis.analysisDate).toLocaleDateString()}
        </small>
      </div>
    </div>
  );
};

export default ResumeAnalysis;
