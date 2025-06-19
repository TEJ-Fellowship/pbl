// components/Quiz/QuizResults.jsx
import React from "react";
import { motion } from "framer-motion";

const QuizResults = ({ score, quizLength, onRetry, onDeleteClick, onViewSaved }) => {
  const correctAnswers = Math.round((score * quizLength) / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto backdrop-blur-sm bg-gray-900/90 border border-gray-800/50 rounded-xl p-8 mt-6 shadow-[0_0_15px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,0,0,0.2)] transition-shadow duration-300 min-h-[calc(100vh-12rem)] flex flex-col justify-center"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Quiz Results</h2>
        <div className="text-8xl font-bold mb-6 bg-gradient-to-r from-red-500 to-red-700 text-transparent bg-clip-text">
          {Math.round(score)}%
        </div>
        <p className="text-xl text-gray-400 mb-8">
          You got {correctAnswers} out of {quizLength} questions correct!
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={onRetry}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-8 py-4 rounded-lg transition-all duration-300 border border-red-500/30"
          >
            Try Again
          </button>
          <button
            onClick={onDeleteClick}
            className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg transition-all duration-300 border border-gray-700/50 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Quiz
          </button>
          <button
            onClick={onViewSaved}
            className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg transition-all duration-300 border border-gray-700/50 flex items-center gap-2"
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
