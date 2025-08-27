import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Skeleton Loader Component (using Tailwind CSS) ---
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
      <div className="h-4 bg-gray-200 rounded col-span-1"></div>
    </div>
    <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
    <div className="space-y-3">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
  </div>
);

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const Preview = () => {
  const { id } = useParams();
  const [structuredResume, setStructuredResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processResume = async () => {
      if (!GEMINI_API_KEY) {
        setError("Gemini API key is missing. Please check your .env file.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch resume from backend
        const resumeResponse = await fetch(
          `http://localhost:5000/api/resumes/${id}`
        );
        if (!resumeResponse.ok) {
          throw new Error(
            `Failed to fetch resume. Status: ${resumeResponse.status}`
          );
        }
        const resumeData = await resumeResponse.json();
        const rawText = resumeData.resume.rawText;
        console.log("Fetched raw text:", rawText);

        // Prepare Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
          Analyze the following resume text and return a clean JSON object.
          Do not include any markdown formatting like \`\`\`json or any introductory text.
          The JSON object should have these keys: "overview", "skills", "experience", "education","projects" training and cerificates and any other key elements that you kind in resume text .
          - "overview" should be a concise 2-3 sentence summary.
          - "skills" should be an array of strings.
          - "experience", "education", and "projects" should be arrays of objects, each with relevant fields like "role", "company", "duration", "description", "degree", "institution", etc. The description should be an array of bullet points.
          - Add a "suggestions" key with an array of 3 actionable improvement suggestions for the resume in simple language.
          Ensure the JSON is properly formatted and valid.  
          Here is the resume text:
          ---
          ${rawText}
          ---
        `;

        const response = await model.generateContent(prompt);

        const responseText =
          response.response.candidates[0].content.parts[0].text;
        const cleanedText = responseText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        setStructuredResume(JSON.parse(cleanedText));
      } catch (err) {
        console.error("Processing Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    processResume();
  }, [id]);

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <SkeletonLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 mt-20 p-4">Error: {error}</div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
  {/* Navbar */}
  <nav className="w-full bg-white border-b shadow-sm fixed top-0 left-0 z-50">
    <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
      <div className="text-xl font-bold text-gray-800">ResumeOptimizer</div>
      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
        <span className="text-sm font-semibold">U</span>
      </div>
    </div>
  </nav>

  {/* Resume Content */}
  <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-10 mt-24">
    {structuredResume?.overview && (
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">
            Resume Overview
          </h2>
        </div>
        <p className="text-gray-700 leading-relaxed">
          {structuredResume.overview}
        </p>
      </section>
    )}

    {structuredResume?.education?.length > 0 && (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
          Education
        </h2>
        <div className="space-y-4">
          {structuredResume.education.map((edu, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                {edu.degree || "Degree"}
              </h3>
              <p className="text-gray-700">
                {edu.institution || "Institution Name"}
              </p>
            </div>
          ))}
        </div>
      </section>
    )}

    {structuredResume?.skills?.length > 0 && (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
          Skills
        </h2>
        <div className="flex flex-wrap gap-2">
          {structuredResume.skills.map((skill, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>
    )}

    {structuredResume?.experience?.length > 0 && (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
          Experience
        </h2>
        <div className="space-y-6">
          {structuredResume.experience.map((job, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold text-gray-900">
                {job.role}
              </h3>
              <p className="text-md text-gray-600">
                {job.company} | {job.duration}
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                {job.description.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    )}

    {structuredResume?.suggestions?.length > 0 && (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
          AI Suggestions
        </h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {structuredResume.suggestions.map((suggestion, index) => (
            <li key={index} className="leading-relaxed">
              {suggestion}
            </li>
          ))}
        </ul>
      </section>
    )}
  </div>
</div>

  );
};

export default Preview;
