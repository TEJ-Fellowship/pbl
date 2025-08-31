import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Skeleton Loader Component ---
const SkeletonLoader = () => (
  <div className="w-full max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-md animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
    <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
    <div className="space-y-3">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 rounded w-11/12"></div>
    </div>
    <div className="h-6 bg-gray-300 rounded w-1/3 my-8"></div>
    <div className="grid grid-cols-4 gap-2 mb-8">
      <div className="h-4 bg-gray-200 rounded col-span-1"></div>
      <div className="h-4 bg-gray-200 rounded col-span-1"></div>
      <div className="h-4 bg-gray-200 rounded col-span-1"></div>
      <div className="h-4 bg-gray-200 rounded col-span-1"></div>
    </div>
  </div>
);

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const JobMatch = () => {
  const { id } = useParams();
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch resume with Authorization
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) throw new Error("You must be logged in to view this resume.");

        const res = await fetch(`http://localhost:5000/api/resumes/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 403) throw new Error("Access denied to this resume.");
        if (res.status === 404) throw new Error("Resume not found.");
        if (!res.ok) throw new Error(`Failed to fetch resume: ${res.status}`);

        const data = await res.json();
        setResumeText(data.extractedText || data.resume?.rawText || "");
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchResume();
  }, [id]);

  // Handle AI Match
  const handleMatch = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description first.");
      return;
    }
    if (!resumeText) {
      setError("Resume not loaded yet.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Compare the following resume against the job description and return a JSON object with:
        - "matchScore" (percentage from 0 to 100)
        - "keyStrengths" (array of strings)
        - "missingKeywords" (array of strings)
        - "summary" (short paragraph explaining match quality)

        Resume:
        ---
        ${resumeText}
        ---

        Job Description:
        ---
        ${jobDescription}
        ---
      `;

      const response = await model.generateContent(prompt);
      const responseText = response.response.candidates[0].content.parts[0].text;

      const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      setMatchResult(JSON.parse(cleanedText));
    } catch (err) {
      setError("AI Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  if (loading) return <div className="bg-gray-50 min-h-screen py-12"><SkeletonLoader /></div>;

  return (
    <>
        {/* Navbar */}
      <nav className="w-full bg-white border-b shadow-sm fixed top-0 left-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="text-xl font-bold text-gray-800">
            {/* ResumeOptimizer */}
              <img src="/Logo.png" alt="ResumeOptimizer Logo" className="h-14 w-auto" />

          </div>
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-semibold">U</span>
          </div>
        </div>
      </nav>
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-md rounded-xl max-w-2xl w-full p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Match Resume to Job Description
        </h1>
        <p className="text-gray-600 mb-6">
          Paste the job description below to see how well your resume aligns with the requirements.
        </p>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste job description here..."
          className="w-full h-32 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
        />

        <button
          onClick={handleMatch}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Match Resume
        </button>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        {matchResult && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Matching Results</h2>

            <p className="text-gray-600 mb-2">Resume Match Score</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div
                className="bg-blue-600 h-3 rounded-full"
                style={{ width: `${matchResult.matchScore || 0}%` }}
              ></div>
            </div>
            <p className="text-blue-600 text-sm mb-4">
              {matchResult.summary || "No summary available"} ({matchResult.matchScore}%)
            </p>

            {matchResult.keyStrengths?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-1">Key Strengths</h3>
                <ul className="list-disc list-inside text-gray-600 text-sm">
                  {matchResult.keyStrengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}

            {matchResult.missingKeywords?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Missing Keywords</h3>
                <ul className="list-disc list-inside text-gray-600 text-sm">
                  {matchResult.missingKeywords.map((k, i) => <li key={i}>{k}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
      </>
  );
};

export default JobMatch;
