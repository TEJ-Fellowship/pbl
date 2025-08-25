// tech-master-LA/frontend/src/pages/Quizzes.jsx
import { useState, useEffect } from "react";
import { quizApi } from "../api/quizApi";
import QuizDisplay from "../components/quiz/QuizDisplay.jsx";
import SavedQuizzes from "../components/quiz/SavedQuizzes.jsx";
import ErrorBoundary from "../components/ErrorBoundary";
import config from "../config/config.js";
import QuizViewToggle from "../components/quiz/QuizViewToggle.jsx";
import { useLocation, useNavigate } from "react-router-dom";

const Quizzes = () => {
  const [quiz, setQuiz] = useState(null);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSavedQuizzes, setShowSavedQuizzes] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const { API_BASE_URL } = config;
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch saved quizzes or handle generated quiz from navigation
  useEffect(() => {
    const { state } = location;

    const startNewQuiz = async (quizData) => {
      try {
        setLoading(true);
        // A quiz from navigation state is considered a new quiz, so we start a new attempt
        const startResponse = await quizApi.startQuiz(quizData._id);
        if (!startResponse.quiz || !startResponse.attempt) {
          throw new Error("Failed to start the quiz.");
        }
        setQuiz(startResponse.quiz);
        setCurrentAttempt(startResponse.attempt);
        setUserAnswers({});
        setShowSavedQuizzes(false);
        setShowResults(false);
        setFinalScore(null);
      } catch (error) {
        console.error("Error starting quiz from navigation:", error);
        setError("Could not load the generated quiz. Please try again.");
        // Clear navigation state to prevent re-triggering the error
        navigate(location.pathname, { replace: true });
      } finally {
        setLoading(false);
      }
    };

    if (state && state.quiz) {
      startNewQuiz(state.quiz);
    } else {
      // Otherwise, fetch saved quizzes
      fetchSavedQuizzes();
    }
    // Clear the location state after processing to prevent issues on refresh
    // navigate(location.pathname, { replace: true, state: {} });
  }, [location.state]);

  const fetchSavedQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await quizApi.getQuizzes();
      if (response.success) {
        setSavedQuizzes(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error(response.error || "Failed to fetch quizzes.");
      }
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

    try {
      // 1. Create the quiz structure
      const createResponse = await quizApi.createQuiz(topic);

      if (!createResponse.success || !createResponse.data) {
        throw new Error(createResponse.error || "Failed to create quiz.");
      }
      const newQuiz = createResponse.data;

      // 2. Immediately start a new attempt for this quiz
      const startResponse = await quizApi.startQuiz(newQuiz._id);
      if (!startResponse.quiz || !startResponse.attempt) {
        throw new Error("Failed to start the newly created quiz.");
      }

      // 3. Set all the necessary state
      setQuiz(startResponse.quiz);
      setCurrentAttempt(startResponse.attempt);
      setUserAnswers({});
      setShowSavedQuizzes(false);
      setShowResults(false);
      setFinalScore(null);

      // 4. Refresh the saved quizzes list in the background
      await fetchSavedQuizzes();
    } catch (error) {
      console.error("Error generating quiz:", error);
      setError(error.message || "Failed to generate quiz");
      setQuiz(null);
      setCurrentAttempt(null);
      setShowSavedQuizzes(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOrContinueQuiz = async (quizId) => {
    if (!quizId) {
      setError("Invalid quiz selected.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const regeneratedQuiz = await quizApi.regenerateQuiz(quizId);

      if (!regeneratedQuiz) {
        throw new Error("Failed to regenerate quiz.");
      }

      // Now, start the newly regenerated quiz
      const { quiz, attempt } = await quizApi.startQuiz(regeneratedQuiz._id);

      if (!quiz || !attempt) {
        throw new Error("Invalid quiz data received after regeneration.");
      }

      setQuiz(quiz);
      setCurrentAttempt(attempt);
      setUserAnswers(attempt.userAnswers || {});
      setShowSavedQuizzes(false);
    } catch (error) {
      console.error("Error starting or continuing quiz:", error);
      setError("Failed to load quiz. Please try again.");
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToListView = async () => {
    setQuiz(null);
    setCurrentAttempt(null);
    setUserAnswers({});
    setShowSavedQuizzes(true);
    setShowResults(false);
    setFinalScore(null);
    await fetchSavedQuizzes();
  };

  const handleAnswer = (questionIndex, answer) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const handleQuizRetry = async () => {
    if (!quiz) return;
    try {
      setLoading(true);
      const { quiz: newQuizData, attempt } = await quizApi.startQuiz(quiz._id);
      if (!attempt) {
        throw new Error("Failed to start a new attempt.");
      }
      setQuiz(newQuizData);
      setCurrentAttempt(attempt);
      setUserAnswers(attempt.userAnswers || {});
      setFinalScore(null);
      setShowResults(false);
    } catch (error) {
      console.error("Error retrying quiz:", error);
      setError("Failed to retry quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizDelete = async (quizId) => {
    if (!quizId) {
      console.error("No quiz ID provided for deletion");
      return;
    }

    try {
      setLoading(true);
      await quizApi.deleteQuiz(quizId);
      await handleResetToListView();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      setError("Failed to delete quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQuiz = async (isAutoSave = false) => {
    // Do not save progress if the results are being shown (quiz is complete)
    if (quiz && currentAttempt && !showResults) {
      try {
        setLoading(!isAutoSave);
        await quizApi.saveProgress(quiz._id, currentAttempt._id, userAnswers);
      } catch (error) {
        console.error("Error saving progress:", error);
        setError("Could not save your progress. Please try again.");
        setLoading(false);
        return;
      }
    }

    if (!isAutoSave) {
      await handleResetToListView();
    } else {
      setLoading(false);
    }
  };

  const handleQuizSubmit = async (finalAnswers) => {
    if (!quiz || !currentAttempt) {
      setError("No active quiz to submit.");
      return;
    }
    try {
      setLoading(true);
      const attempt = await quizApi.submitQuiz(
        quiz._id,
        currentAttempt._id,
        finalAnswers
      );
      setFinalScore(attempt.score);
      setShowResults(true);
      await fetchSavedQuizzes(); // Refresh list in the background
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setError("Failed to submit quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
      {/* <h1 className="text-4xl font-bold text-center mb-8">Tech Master Quiz</h1>

        {!quiz && (
          <QuizViewToggle
            showSavedQuizzes={showSavedQuizzes}
            setShowSavedQuizzes={setShowSavedQuizzes}
          />
        )} */}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showSavedQuizzes ? (
        <div className="max-w-6xl mx-auto">
          <ErrorBoundary>
            <SavedQuizzes
              quizzes={savedQuizzes}
              onRetake={handleStartOrContinueQuiz}
              onGenerate={handleGenerateQuiz}
              onDelete={handleQuizDelete}
              isLoading={loading}
            />
          </ErrorBoundary>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <ErrorBoundary>
            {quiz && (
              <QuizDisplay
                quiz={quiz}
                userAnswers={userAnswers}
                setUserAnswers={setUserAnswers}
                onDelete={handleQuizDelete}
                onQuizSubmit={handleQuizSubmit}
                onLeaveQuiz={handleLeaveQuiz}
                onRetry={handleQuizRetry}
                onViewSaved={handleResetToListView}
                showResults={showResults}
                score={finalScore}
              />
            )}
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
};

export default Quizzes;
