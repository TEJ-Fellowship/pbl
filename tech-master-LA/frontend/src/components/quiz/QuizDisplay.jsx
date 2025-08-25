// tech-master-LA/frontend/src/components/Quiz/QuizDisplay.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DeleteQuizModal from "./DeleteQuizModal";
import QuizHeader from "./QuizHeader";
import QuestionNavigation from "./QuestionNavigation";
import QuizResults from "./QuizResults";
import QuizQuestion from "./QuizQuestion";
import { toast } from "react-hot-toast";

const QuizDisplay = ({
  quiz,
  userAnswers,
  setUserAnswers,
  onDelete,
  onQuizSubmit,
  onLeaveQuiz,
  onRetry,
  onViewSaved,
  showResults,
  score,
}) => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-save progress every 15 seconds
  useEffect(() => {
    const autoSave = setInterval(() => {
      if (!showResults) {
        onLeaveQuiz(true); // Pass a flag to indicate this is an auto-save
        toast.success("Progress saved automatically!");
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSave);
  }, [userAnswers, showResults, onLeaveQuiz]);

  // Validate quiz structure
  if (!quiz || !quiz.questions || !Array.isArray(quiz.questions)) {
    console.error("Invalid quiz structure:", quiz);
    return (
      <div className="text-center text-red-500 p-8">
        <h3 className="text-xl font-semibold mb-2">Invalid Quiz Format</h3>
        <p>
          The quiz data is not in the correct format. Please try generating a
          new quiz.
        </p>
        <button
          onClick={onLeaveQuiz}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Validate each question
  const invalidQuestions = quiz.questions.filter(
    (q) => !q.question || !q.options || !Array.isArray(q.options) || !q.correct
  );

  if (invalidQuestions.length > 0) {
    console.error("Invalid questions found:", invalidQuestions);
    return (
      <div className="text-center text-red-500 p-8">
        <h3 className="text-xl font-semibold mb-2">Quiz Format Error</h3>
        <p>
          Some questions are not properly formatted. Please try generating a new
          quiz.
        </p>
        <button
          onClick={onLeaveQuiz}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Add debug logging
  console.log("QuizDisplay received quiz:", quiz);
  console.log("Quiz questions:", quiz.questions);

  const handleAnswer = (questionIndex, selectedOption) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: selectedOption,
    }));
  };

  const handleSubmit = () => {
    // Parent component handles submission logic
    onQuizSubmit(userAnswers);
  };

  const handleDelete = async () => {
    // Now handled by the parent component via onDelete prop
    onDelete(quiz._id);
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center text-red-500">
        Failed to load quiz. Please try again later.
      </div>
    );
  }

  return (
    <>
      {showDeleteConfirm && (
        <DeleteQuizModal
          quiz={quiz}
          onDelete={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={isDeleting}
        />
      )}

      <div className="max-w-3xl mx-auto p-4">
        {showResults ? (
          <QuizResults
            score={score}
            quizLength={quiz.questions.length}
            onRetry={onRetry}
            onDeleteClick={() => setShowDeleteConfirm(true)}
            onViewSaved={onViewSaved}
          />
        ) : (
          <>
            {/* Quiz Header */}
            <QuizHeader
              title={quiz.title}
              topic={quiz.topic}
              onDelete={() => setShowDeleteConfirm(true)}
              onLeave={onLeaveQuiz}
              currentQuestion={currentQuestion}
              totalQuestions={quiz.questions.length}
            />

            {/* Current Question */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="backdrop-blur-sm bg-gray-900/90 border border-gray-800/50 rounded-xl p-6 shadow-2xl"
            >
              <h2 className="text-xl font-semibold text-white mb-6">
                {quiz.questions[currentQuestion].question}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quiz.questions[currentQuestion].options.map(
                  (option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(currentQuestion, option)}
                      className={`p-4 rounded-xl text-left transition-all duration-200 ${
                        userAnswers[currentQuestion] === option
                          ? "bg-red-500 text-white shadow-lg border border-red-500/30"
                          : "bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border border-gray-700/50"
                      }`}
                    >
                      <span className="font-medium">{option}</span>
                    </motion.button>
                  )
                )}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() =>
                    setCurrentQuestion((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentQuestion === 0}
                  className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                    currentQuestion === 0
                      ? "bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700/30"
                      : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700/50"
                  }`}
                >
                  Previous
                </button>

                {currentQuestion === quiz.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={
                      Object.keys(userAnswers).length !== quiz.questions.length
                    }
                    className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                      Object.keys(userAnswers).length === quiz.questions.length
                        ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border border-red-500/30"
                        : "bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700/30"
                    }`}
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setCurrentQuestion((prev) =>
                        Math.min(quiz.questions.length - 1, prev + 1)
                      )
                    }
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white transition-all duration-300 border border-red-500/30"
                  >
                    Next
                  </button>
                )}
              </div>
            </motion.div>

            {/* Question Navigation */}
            <QuestionNavigation
              questions={quiz.questions}
              currentQuestion={currentQuestion}
              userAnswers={userAnswers}
              onNavigate={(index) => setCurrentQuestion(index)}
            />
          </>
        )}
      </div>
    </>
  );
};

export default QuizDisplay;
