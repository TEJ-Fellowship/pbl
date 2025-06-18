// components/Quiz/QuestionNavigation.jsx
import React from "react";
import { motion } from "framer-motion";

const QuestionNavigation = ({ questions, currentQuestion, userAnswers, onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-white shadow-xl rounded-xl p-4"
    >
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => onNavigate(index)}
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
  );
};

export default QuestionNavigation;