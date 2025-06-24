import React, { useState, useEffect } from "react";
import { resumeService } from "../../services/resumeService";
import { aiService } from "../../services/aiService";

const ResumeComparison = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResumes, setSelectedResumes] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const result = await resumeService.getResumes();
      setResumes(result.data);
    } catch (err) {
      setError("Failed to load resumes");
    }
  };

  const handleResumeSelect = (resumeId) => {
    setSelectedResumes((prev) =>
      prev.includes(resumeId)
        ? prev.filter((id) => id !== resumeId)
        : [...prev, resumeId]
    );
  };

  const handleCompare = async () => {
    if (selectedResumes.length < 2) {
      setError("Please select at least 2 resumes to compare");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await aiService.compareResumes(selectedResumes);
      setComparisonResult(result.data);
    } catch (err) {
      setError("Comparison failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Compare Resumes</h3>

      <div>
        <h4>Select Resumes to Compare (2-5)</h4>
        <div>
          {resumes.map((resume) => (
            <label key={resume.id}>
              <input
                type="checkbox"
                checked={selectedResumes.includes(resume.id)}
                onChange={() => handleResumeSelect(resume.id)}
              />
              <span>{resume.originalName}</span>
              <span>({(resume.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleCompare}
        disabled={selectedResumes.length < 2 || loading}
      >
        {loading ? "Comparing..." : `Compare ${selectedResumes.length} Resumes`}
      </button>

      {error && <div>{error}</div>}

      {comparisonResult && (
        <div>
          <h4>Comparison Results</h4>

          <div>
            <p>
              <strong>Total Resumes:</strong>{" "}
              {comparisonResult.summary.totalResumes}
            </p>
            <p>
              <strong>Average Text Length:</strong>{" "}
              {Math.round(comparisonResult.summary.averageTextLength)}{" "}
              characters
            </p>
            <p>
              <strong>Common Skills:</strong>{" "}
              {comparisonResult.summary.commonSkills.join(", ")}
            </p>
          </div>

          <div>
            {comparisonResult.comparisons.map((resume, index) => (
              <div key={resume.id}>
                <h5>{resume.name}</h5>
                <div>
                  <p>
                    <strong>Experience Level:</strong> {resume.experienceLevel}
                  </p>
                  <p>
                    <strong>Text Length:</strong> {resume.textLength} characters
                  </p>
                  <p>
                    <strong>Skills:</strong>
                  </p>
                  <div>
                    {resume.skills.map((skill, skillIndex) => (
                      <span key={skillIndex}>{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeComparison;
