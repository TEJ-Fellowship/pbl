// components/Quiz/QuizHeader.jsx
import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const QuizHeader = ({
  title,
  topic,
  onDelete,
  onLeave,
  currentQuestion,
  totalQuestions,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-sm bg-gray-900/90 border border-gray-800/50 rounded-xl p-6 mb-6 shadow-[0_0_15px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,0,0,0.2)] transition-shadow duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-gray-400 mt-2">Topic: {topic}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              onLeave();
            }}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-full"
            title="Save & Exit"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center mt-4">
        <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-700 transition-all duration-300"
            style={{
              width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
            }}
          ></div>
        </div>
        <span className="ml-4 text-sm text-gray-400 font-medium">
          Question {currentQuestion + 1} of {totalQuestions}
        </span>
      </div>
    </motion.div>
  );
};

export default QuizHeader;
