import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  </div>
);

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const Preview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [structuredResume, setStructuredResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect to login if no token
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const processResume = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("jwtToken");
        if (!token) {
          setError("You are not logged in. Please login first.");
          setLoading(false);
          return;
        }

        const resumeResponse = await fetch(
          `http://localhost:5000/api/resumes/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (resumeResponse.status === 401) {
          setError("Unauthorized! Please login again.");
          setLoading(false);
          return;
        }

        if (!resumeResponse.ok) {
          throw new Error(`Failed to fetch resume. Status: ${resumeResponse.status}`);
        }

        const resumeData = await resumeResponse.json();
const rawText = resumeData?.extractedText;
if (!rawText) throw new Error("Resume text not found.");


        console.log("Fetched raw text:", rawText);

        // Gemini AI
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
          Analyze the following resume text and return a clean JSON object.
          Do not include markdown formatting or introductory text.
          Keys: overview, skills, experience, education, projects, training, certificates.
          Add a "suggestions" key with 3 actionable improvement suggestions.
          Here is the resume text:
          ---
          ${rawText}
          ---
        `;
        const response = await model.generateContent(prompt);
        const responseText = response?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error("Gemini API returned empty response.");

        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        setStructuredResume(JSON.parse(cleanedText));

      } catch (err) {
        console.error("Processing Error:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    processResume();
  }, [id]);

  // --- Render Logic ---
  if (loading) return <div className="bg-gray-50 min-h-screen py-12"><SkeletonLoader /></div>;
  if (error) return <div className="text-center text-red-500 mt-20 p-4">Error: {error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
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

      {/* Resume Content */}
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-10 mt-24">
        {/* Overview */}
        {structuredResume?.overview && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Resume Overview</h2>
            <p className="text-gray-700 leading-relaxed">{structuredResume.overview}</p>
          </section>
        )}

        {/* Education */}
        {structuredResume?.education?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Education</h2>
            <div className="space-y-4">
              {structuredResume.education.map((edu, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900">{edu.degree || "Degree"}</h3>
                  <p className="text-gray-700">{edu.institution || "Institution Name"}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {structuredResume?.skills?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {structuredResume.skills.map((skill, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {structuredResume?.experience?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Experience</h2>
            <div className="space-y-6">
              {structuredResume.experience.map((job, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-900">{job.role}</h3>
                  <p className="text-md text-gray-600">{job.company} | {job.duration}</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                    {(Array.isArray(job.description) ? job.description : []).map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI Suggestions */}
        {structuredResume?.suggestions?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">AI Suggestions</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {structuredResume.suggestions.map((suggestion, index) => (
                <li key={index} className="leading-relaxed">{suggestion}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default Preview;
