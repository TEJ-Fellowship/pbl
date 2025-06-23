// tech-master-LA/frontend/src/pages/SmartQuizzes.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import QuizDisplay from "../components/quiz/QuizDisplay.jsx";
import SavedQuizzes from "../components/quiz/SavedQuizzes.jsx";
import QuizDebug from "../components/quiz/QuizDebug.jsx";
import ErrorBoundary from "../components/ErrorBoundary";
import config from "../config/config.js";
import { useLocation } from "react-router-dom";

const SmartQuizzes = () => {
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [savedSmartQuizzes, setSavedQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSavedQuizzes, setShowSavedQuizzes] = useState(false);
  const { API_BASE_URL } = config;
  const location = useLocation();

  // Create axios instance with credentials
  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
  });

  // Check if quiz was passed from chat
  useEffect(() => {
    const location = window.location;
    if (location.state?.quiz) {
      console.log("Quiz received from chat:", location.state.quiz);
      setQuiz(location.state.quiz);
      setUserAnswers({});
      setShowSavedQuizzes(false);
      // Clear the state to prevent issues on refresh
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Fetch saved quizzes on load (only if no quiz is currently displayed)
  useEffect(() => {
    if (!quiz) {
      fetchSavedQuizzes();
    }
  }, [quiz]);

  useEffect(() => {
    // Check if a quiz was passed from the chat page
    if (location.state?.fromChat && location.state?.quiz) {
      const generatedQuiz = {
        ...location.state.quiz,
        title: location.state.topic || location.state.quiz.title, // Use the topic as the title
      };
      setQuiz(generatedQuiz);
    }
  }, [location.state]);

  const fetchSavedQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/quiz");
      setSavedQuizzes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setError("Failed to load quizzes. Please try again later.");
      setSavedQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async (topic, creatorName) => {
    if (!topic) {
      setError("Please select a topic first");
      return;
    }

    setLoading(true);
    setError(null);
    setShowSavedQuizzes(false);

    try {
      const generatedQuiz = await generateNewQuiz(topic);

      if (
        !generatedQuiz ||
        !generatedQuiz.questions ||
        !Array.isArray(generatedQuiz.questions)
      ) {
        throw new Error("Invalid quiz format received");
      }

      // Add creator information to the quiz
      const quizWithCreator = {
        ...generatedQuiz,
        createdBy: creatorName || "Anonymous",
      };

      const response = await api.post("/api/quiz", quizWithCreator);

      if (!response.data || !response.data._id) {
        throw new Error("Invalid response from server");
      }

      setQuiz(response.data);
      setUserAnswers({});
      await fetchSavedQuizzes();
    } catch (error) {
      console.error("Error generating quiz:", error);
      setError(error.message || "Failed to generate quiz");
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionIndex, answer) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const handleQuizDelete = async (quizId) => {
    if (!quizId) {
      console.error("No quiz ID provided for deletion");
      return;
    }

    try {
      await api.delete(`/api/quiz/${quizId}`);
      await fetchSavedQuizzes();

      if (quiz?._id === quizId) {
        setQuiz(null);
        setUserAnswers({});
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      setError("Failed to delete quiz");
    }
  };

  const handleQuizComplete = async () => {
    try {
      setLoading(true);
      setError(null);
      // Reset quiz state first
      setQuiz(null);
      setUserAnswers({});
      // Then fetch and show saved quizzes
      await fetchSavedQuizzes();
      setShowSavedQuizzes(true);
    } catch (error) {
      console.error("Error refreshing quizzes:", error);
      setError("Failed to refresh quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = async (quizId) => {
    if (!quizId) {
      setError("Invalid quiz selected for retake");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/quiz/${quizId}`);

      if (
        !response.data ||
        !response.data.questions ||
        !Array.isArray(response.data.questions)
      ) {
        throw new Error("Invalid quiz data received");
      }

      setQuiz(response.data);
      setUserAnswers({});
      setShowSavedQuizzes(false);
    } catch (error) {
      console.error("Error retaking quiz:", error);
      setError("Failed to load quiz. Please try again.");
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizGenerated = (generatedQuiz) => {
    // ... existing code ...
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-black">
      <h1 className="text-4xl font-bold text-center mb-8 text-white">
        Tech Master Quiz
      </h1>

      {!quiz && (
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setShowSavedQuizzes(false)}
            className={`px-6 py-2 rounded-lg transition-colors ${
              !showSavedQuizzes
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Generate Quiz
          </button>
          <button
            onClick={() => setShowSavedQuizzes(true)}
            className={`px-6 py-2 rounded-lg transition-colors ${
              showSavedQuizzes
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Saved Quizzes
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showSavedQuizzes ? (
        <div className="max-w-4xl mx-auto">
          <ErrorBoundary>
            <SavedQuizzes
              quizzes={savedSmartQuizzes}
              onRetake={handleRetake}
              isLoading={loading}
            />
          </ErrorBoundary>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <ErrorBoundary>
            {quiz ? (
              <>
                <QuizDebug quiz={quiz} />
                <QuizDisplay
                  quiz={quiz}
                  userAnswers={userAnswers}
                  setUserAnswers={setUserAnswers}
                  onDelete={handleQuizDelete}
                  onQuizComplete={handleQuizComplete}
                />
              </>
            ) : (
              <QuizGenerator
                onGenerateQuiz={handleGenerateQuiz}
                isLoading={loading}
              />
            )}
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
};

export default SmartQuizzes;
