// components/Quiz/QuestionCard.jsx
import React from "react";
import { motion } from "framer-motion";

const QuestionCard = ({
  question,
  options,
  selectedAnswer,
  onSelect,
  onPrev,
  onNext,
  onSubmit,
  isFirst,
  isLast,
  disableSubmit
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="backdrop-blur-sm bg-gray-900/90 border border-gray-800/50 rounded-xl p-6 shadow-[0_0_15px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,0,0,0.2)] transition-shadow duration-300"
    >
      <h2 className="text-xl font-semibold text-white mb-6">{question}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(option)}
            className={`p-4 rounded-xl text-left transition-all duration-200 ${
              selectedAnswer === option
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg border border-red-500/30"
                : "bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border border-gray-700/50"
            }`}
          >
            <span className="font-medium">{option}</span>
          </motion.button>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className={`px-6 py-2 rounded-lg transition-all duration-300 ${
            isFirst
              ? "bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700/30"
              : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700/50"
          }`}
        >
          Previous
        </button>

        {isLast ? (
          <button
            onClick={onSubmit}
            disabled={disableSubmit}
            className={`px-6 py-2 rounded-lg transition-all duration-300 ${
              disableSubmit
                ? "bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700/30"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border border-red-500/30"
            }`}
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={onNext}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white transition-all duration-300 border border-red-500/30"
          >
            Next
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default QuestionCard;
