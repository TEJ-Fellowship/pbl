// tech-master-LA/frontend/src/components/Quiz/QuizDisplay.jsx
import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import DeleteQuizModal from "./DeleteQuizModal";
import QuizHeader from "./QuizHeader";
import QuestionNavigation from "./QuestionNavigation";
import QuizResults from "./QuizResults";
import QuizQuestion from "./QuizQuestion";


const QuizDisplay = ({ quiz, userAnswers, setUserAnswers, onDelete, onQuizComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAnswer = (questionIndex, selectedOption) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption
    }));
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    Object.keys(userAnswers).forEach(questionIndex => {
      if (quiz.questions[questionIndex].correct === userAnswers[questionIndex]) {
        correctAnswers++;
      }
    });
    return (correctAnswers / quiz.questions.length) * 100;
  };

  const handleSubmit = async () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);

    try {
      await axios.post(`http://localhost:5000/api/quizzes/${quiz._id}/attempts`, {
        score: finalScore
      });
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`http://localhost:5000/api/quizzes/${quiz._id}`);
      onDelete(quiz._id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting quiz:', error);
    } finally {
      setIsDeleting(false);
    }
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
            onRetry={() => {
              setShowResults(false);
              setCurrentQuestion(0);
              setUserAnswers({});
              setScore(null);
              setIsLoading(false);
            }}
            onDeleteClick={() => setShowDeleteConfirm(true)}
            onViewSaved={onQuizComplete}
          />
        ) : (
          <>
            {/* Quiz Header */}
            <QuizHeader 
                quiz={quiz} 
                currentQuestion={currentQuestion} 
                onDeleteClick={() => setShowDeleteConfirm(true)} 
              />

            {/* Current Question */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white shadow-xl rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {quiz.questions[currentQuestion].question}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quiz.questions[currentQuestion].options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(currentQuestion, option)}
                    className={`p-4 rounded-xl text-left transition-all duration-200 ${
                      userAnswers[currentQuestion] === option
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                  </motion.button>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className={`px-6 py-2 rounded-lg ${
                    currentQuestion === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  Previous
                </button>

                {currentQuestion === quiz.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={Object.keys(userAnswers).length !== quiz.questions.length}
                    className={`px-6 py-2 rounded-lg ${
                      Object.keys(userAnswers).length === quiz.questions.length
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                    className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
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