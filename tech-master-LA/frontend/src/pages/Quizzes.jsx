// tech-master-LA/frontend/src/pages/Quizzes.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import QuizGenerator from "../components/Quiz/QuizGenerator";
import QuizDisplay from "../components/Quiz/QuizDisplay";
import SavedQuizzes from "../components/Quiz/SavedQuizzes";
import generateNewQuiz from "../../api/generateNewQuiz";

const Quizzes = () => {
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("saved");
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://localhost:5000/api";

  // Fetch saved quizzes on load
  useEffect(() => {
    fetchSavedQuizzes();
  }, []);

  const fetchSavedQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/quizzes`);
      // The backend returns the quizzes directly as an array
      setSavedQuizzes(res.data || []);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
      setError("Failed to load quizzes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

 // In Quizzes.jsx
const handleGenerateQuiz = async () => {
  setLoading(true);
  setError(null);
  try {
    // First generate the quiz using AI
    const generatedQuiz = await generateNewQuiz("JavaScript"); // or any topic
    if (!generatedQuiz.success) {
      throw new Error(generatedQuiz.error);
    }

    // Then save it to your backend
    const res = await axios.post(`${API_BASE_URL}/quizzes`, generatedQuiz.data);
    
    setQuiz(res.data);
    setUserAnswers({});
    setActiveTab("current");
  } catch (err) {
    console.error("Error generating quiz:", err);
    setError(err.message || "Failed to generate quiz. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const handleAnswer = (questionIndex, answer) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const handleRetake = async (quizId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/quizzes/${quizId}`);
      setQuiz(res.data); // Backend returns the quiz directly
      setUserAnswers({});
      setActiveTab("current");
    } catch (err) {
      console.error("Error retaking quiz:", err);
      setError("Failed to load quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2 rounded-full font-medium transition ${
              activeTab === "saved"
                ? "bg-blue-600 text-white"
                : "bg-white border border-blue-600 text-blue-600"
            }`}
          >
            📚 Saved Quizzes
          </button>
          <button
            onClick={() => setActiveTab("current")}
            className={`px-4 py-2 rounded-full font-medium transition ${
              activeTab === "current"
                ? "bg-purple-600 text-white"
                : "bg-white border border-purple-600 text-purple-600"
            }`}
          >
            🎯 Current Quiz
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Content */}
        {activeTab === "saved" && (
          <>
            <QuizGenerator onGenerate={handleGenerateQuiz} />
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <SavedQuizzes 
                quizzes={savedQuizzes} 
                onRetake={handleRetake}
              />
            )}
          </>
        )}

        {activeTab === "current" && (
          <>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : quiz ? (
              <QuizDisplay
                quiz={quiz}
                onAnswer={handleAnswer}
                userAnswers={userAnswers}
              />
            ) : (
              <div className="text-center bg-white rounded-lg shadow-md p-8">
                <p className="text-gray-500 text-lg">
                  No quiz loaded yet. Generate a new quiz or select one from saved quizzes.
                </p>
                <button
                  onClick={handleGenerateQuiz}
                  className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
                >
                  Generate New Quiz
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Quizzes;