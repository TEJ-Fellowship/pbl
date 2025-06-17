// tech-master-LA/frontend/src/components/Quiz/QuizDisplay.jsx
import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import DeleteQuizModal from "./DeleteQuizModal";

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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto bg-white shadow-xl rounded-xl p-8 mt-6"
          >
            <h2 className="text-3xl font-bold text-center mb-6">Quiz Results</h2>
            <div className="text-center">
              <div className="text-6xl font-bold mb-4 text-blue-500">
                {Math.round(score)}%
              </div>
              <p className="text-xl text-gray-600 mb-6">
                You got {Math.round(score * quiz.questions.length / 100)} out of {quiz.questions.length} questions correct!
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setShowResults(false);
                    setCurrentQuestion(0);
                    setUserAnswers({});
                    setScore(null);
                    setIsLoading(false);
                  }}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Quiz
                </button>
                <button
                  onClick={onQuizComplete}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  View Saved Quizzes
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Quiz Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white shadow-xl rounded-xl p-6 mb-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{quiz.title}</h1>
                  <p className="text-gray-600 mt-2">Topic: {quiz.topic}</p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-500 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                  title="Delete Quiz"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center mt-4">
                <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-4 text-sm text-gray-600">
                  {currentQuestion + 1}/{quiz.questions.length}
                </span>
              </div>
            </motion.div>

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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white shadow-xl rounded-xl p-4"
            >
              <div className="flex flex-wrap gap-2 justify-center">
                {quiz.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      currentQuestion === index
                        ? 'bg-blue-500 text-white'
                        : userAnswers[index]
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </>
  );
};

export default QuizDisplay;