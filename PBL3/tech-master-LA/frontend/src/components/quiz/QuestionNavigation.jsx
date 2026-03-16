// components/Quiz/QuestionNavigation.jsx
import React from "react";
import { motion } from "framer-motion";

const QuestionNavigation = ({ questions, currentQuestion, userAnswers, onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 backdrop-blur-sm bg-gray-900/90 border border-gray-800/50 rounded-xl p-4 shadow-[0_0_15px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,0,0,0.2)] transition-shadow duration-300"
    >
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => onNavigate(index)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              currentQuestion === index
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-500/30'
                : userAnswers[index]
                ? 'bg-gray-800 text-green-400 border border-green-500/30'
                : 'bg-gray-800/80 text-gray-400 border border-gray-700/50 hover:bg-gray-700/80'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuestionNavigation;