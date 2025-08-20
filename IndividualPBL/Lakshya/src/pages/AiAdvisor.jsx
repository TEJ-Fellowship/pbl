import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RotateCw, BookOpen, TrendingUp } from "lucide-react";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const AiAdvisor = () => {
  const [userInterests, setUserInterests] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recommendations, setRecommendations] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserData = () => {
      try {
        const savedInterests = localStorage.getItem("careerInterests");
        const savedGoals = localStorage.getItem("goals");
        const interests = savedInterests ? JSON.parse(savedInterests) : [];
        const userGoals = savedGoals ? JSON.parse(savedGoals) : [];
        setUserInterests(interests);
        setGoals(userGoals);
        return { interests, userGoals };
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Failed to load your profile data.");
        return { interests: [], userGoals: [] };
      }
    };
    const { interests, userGoals } = loadUserData();
    if (interests.length > 0) {
      generateRecommendations(interests, userGoals);
    }
  }, []);
  const generateRecommendations = async (interests, userGoals) => {
    if (interests.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const primaryGoal = userGoals.length > 0 ? userGoals[0] : null;
      const goalInfo = primaryGoal
        ? `Primary Career Goal: ${primaryGoal.title} - "${primaryGoal.description}" (Category: ${primaryGoal.category})`
        : "No specific career goals set";
      const prompt = `
        Based on the following information about a person:
        
        # Career Interests:
        - ${interests.join(",")} 
        - ${userGoals.join(",")}
        
        Please recommend:
        1. 3-5 courses that would help them advance in their career interests
        2. 3-5 key skills they should develop
        
        Return the recommendations ONLY in this JSON format:
        
        {
          "courses": [
            {
              "title": "Course name",
              "description": "Brief description",
              "provider": "Provider name (like Coursera, Udemy, etc.)",
              "duration": "Estimated duration",
              "level": "Beginner/Intermediate/Advanced",
            }
          ],
          "skills": [
            {
              "name": "Skill name",
              "resources": "Brief suggestion on how to develop this skill",
              "importance": "High/Medium/Low priority"
            }
          ]
        }
      `;
      const safetySettings = [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ];
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        safetySettings,
      });
      const response = await result.response;
      const text = response.text();
      let jsonData;
      try {
        jsonData = JSON.parse(text);
      } catch (error) {
        console.log(
          "Direct JSON parsing failed, attempting to extract from markdown:",
          error.message
        );
        const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error("Could not parse response as JSON");
        }
      }

      console.log("Received recommendations:", jsonData);
      setRecommendations(jsonData);
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setError(`Failed to generate recommendations: ${err.message}`);
    }

    setLoading(false);
  };
  const refreshRecommendations = () => {
    if (userInterests.length === 0) return;
    generateRecommendations(userInterests, goals);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-slate-700 dark:text-white mb-2">
          AI Course Recommender
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Get course suggestions based on your interests and goals
        </p>
      </div>

      {/* No interests message */}
      {userInterests.length === 0 && (
        <div className="bg-blue-50 dark:bg-slate-800 p-6 rounded-lg mb-8 text-center">
          <p className="text-blue-700 dark:text-blue-300">
            Please add your career interests in the Career section to get
            personalized recommendations.
          </p>
        </div>
      )}

      {/* User Profile Summary */}
      {userInterests.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white mb-2">
                Your Profile
              </h2>

              {/* Career Interests */}
              <div className="mb-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Career Interests:
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {userInterests.map((interest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Primary Goal */}
              {goals.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Primary Goal:
                  </p>
                  <p className="font-medium text-slate-800 dark:text-white">
                    {goals[0].title}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={refreshRecommendations}
              disabled={loading || userInterests.length === 0}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RotateCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh Recommendations
            </button>
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-slate-700 dark:text-white mb-4 flex items-center">
          <span className="mr-2">✨</span> Course Recommendations
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg mb-8">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        ) : recommendations && recommendations.courses?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Recommendations */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="p-5 bg-gradient-to-r from-blue-500/80 to-indigo-600/80 text-white">
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  <h3 className="font-bold text-xl">Recommended Courses</h3>
                </div>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {recommendations.courses?.map((course, index) => (
                  <div key={index} className="p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-slate-800 dark:text-white">
                        {course.title}
                      </h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {course.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
                        {course.provider}
                      </span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
                        {course.duration}
                      </span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
                        {course.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="p-5 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 text-white">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  <h3 className="font-bold text-xl">Key Skills to Develop</h3>
                </div>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {recommendations.skills?.map((skill, index) => (
                  <div key={index} className="p-4">
                    <div className="flex justify-between">
                      <h4 className="font-semibold text-slate-800 dark:text-white">
                        {skill.name}
                      </h4>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          skill.importance === "High"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                            : skill.importance === "Medium"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        }`}
                      >
                        {skill.importance}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {skill.resources}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : userInterests.length > 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-600 dark:text-slate-300">
              Click the refresh button to generate personalized recommendations.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AiAdvisor;
