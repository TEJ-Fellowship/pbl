// components/Quiz/QuizHeader.jsx
import React from "react";
import { motion } from "framer-motion";

const QuizHeader = ({ quiz, currentQuestion, onDeleteClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-sm bg-gray-900/90 border border-gray-800/50 rounded-xl p-6 mb-6 shadow-[0_0_15px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,0,0,0.2)] transition-shadow duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{quiz.title}</h1>
          <p className="text-gray-400 mt-2">Topic: {quiz.topic}</p>
        </div>
        <button
          onClick={onDeleteClick}
          className="text-red-500 hover:text-red-400 transition-colors p-2 hover:bg-red-900/30 rounded-full"
          title="Delete Quiz"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center mt-4">
        <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-700 transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
        <span className="ml-4 text-sm text-gray-400">
          {currentQuestion + 1}/{quiz.questions.length}
        </span>
      </div>
    </motion.div>
  );
};

export default QuizHeader;
