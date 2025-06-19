// tech-master-LA/frontend/src/pages/Quizzes.jsx
import  { useState, useEffect } from "react";
import axios from "axios";
import QuizGenerator from "../components/quiz/QuizGenerator.jsx";
import QuizDisplay from "../components/quiz/QuizDisplay.jsx";
import SavedQuizzes from "../components/quiz/SavedQuizzes.jsx";
import generateNewQuiz from "../api/generateNewQuiz.js";
import ErrorBoundary from "../components/ErrorBoundary";
import config from "../config/config.js"

const Quizzes = () => {
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSavedQuizzes, setShowSavedQuizzes] = useState(true);
  const { API_BASE_URL } = config;

  // Fetch saved quizzes on load
  useEffect(() => {
    fetchSavedQuizzes();
  }, []);

  const fetchSavedQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/quizzes`);
      setSavedQuizzes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setError("Failed to load quizzes. Please try again later.");
      setSavedQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async (topic) => {
    if (!topic) {
      setError("Please select a topic first");
      return;
    }

    setLoading(true);
    setError(null);
    setShowSavedQuizzes(false);
    
    try {
      const generatedQuiz = await generateNewQuiz(topic);
      
      if (!generatedQuiz || !generatedQuiz.questions || !Array.isArray(generatedQuiz.questions)) {
        throw new Error("Invalid quiz format received");
      }

      const response = await axios.post(`${API_BASE_URL}/quizzes`, generatedQuiz);
      
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

  // eslint-disable-next-line no-unused-vars
  const handleAnswer = (questionIndex, answer) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const handleQuizDelete = async (quizId) => {
    if (!quizId) {
      console.error("No quiz ID provided for deletion");
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/quizzes/${quizId}`);
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
      const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}`);
      
      if (!response.data || !response.data.questions || !Array.isArray(response.data.questions)) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Tech Master Quiz</h1>
      
      {!quiz&&(<div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setShowSavedQuizzes(false)}
          className={`px-6 py-2 rounded-lg transition-colors ${
            !showSavedQuizzes
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Generate Quiz
        </button>
        <button
          onClick={() => setShowSavedQuizzes(true)}
          className={`px-6 py-2 rounded-lg transition-colors ${
            showSavedQuizzes
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Saved Quizzes
        </button>
      </div>)}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showSavedQuizzes ? (
        <div className="max-w-4xl mx-auto">
          <ErrorBoundary>
            <SavedQuizzes
              quizzes={savedQuizzes}
              onRetake={handleRetake}
              isLoading={loading}
            />
          </ErrorBoundary>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <ErrorBoundary>
            {!quiz&&(<QuizGenerator onGenerate={handleGenerateQuiz} isLoading={loading} />)}
            {quiz && (
              <QuizDisplay
                quiz={quiz}
                userAnswers={userAnswers}
                setUserAnswers={setUserAnswers}
                onDelete={handleQuizDelete}
                onQuizComplete={handleQuizComplete}
              />
            )}
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
};

export default Quizzes;