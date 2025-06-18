// components/Quiz/QuizResults.jsx
import React from "react";
import { motion } from "framer-motion";

const QuizResults = ({ score, quizLength, onRetry, onDeleteClick, onViewSaved }) => {
  const correctAnswers = Math.round((score * quizLength) / 100);

  return (
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
          You got {correctAnswers} out of {quizLength} questions correct!
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onRetry}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={onDeleteClick}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Quiz
          </button>
          <button
            onClick={onViewSaved}
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
  );
};

export default QuizResults;
