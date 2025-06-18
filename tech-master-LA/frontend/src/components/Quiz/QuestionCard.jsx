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
      className="bg-white shadow-xl rounded-xl p-6"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-6">{question}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(option)}
            className={`p-4 rounded-xl text-left transition-all duration-200 ${
              selectedAnswer === option
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-gray-50 hover:bg-gray-100 text-gray-700"
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
          className={`px-6 py-2 rounded-lg ${
            isFirst
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-500 text-white hover:bg-gray-600"
          }`}
        >
          Previous
        </button>

        {isLast ? (
          <button
            onClick={onSubmit}
            disabled={disableSubmit}
            className={`px-6 py-2 rounded-lg ${
              disableSubmit
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={onNext}
            className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            Next
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default QuestionCard;
