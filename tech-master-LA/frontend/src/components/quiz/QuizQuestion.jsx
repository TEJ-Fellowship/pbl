// tech-master-LA/frontend/src/components/Quiz/QuizQuestion.jsx
import React from "react";
import { motion } from "framer-motion";

const QuizQuestion = ({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswer,
  onPrev,
  onNext,
  onSubmit,
}) => {
  return (
    <motion.div
      key={questionIndex}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-white shadow-xl rounded-xl p-6"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-6">{question.question}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {question.options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer(questionIndex, option)}
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
          disabled={questionIndex === 0}
          className={`px-6 py-2 rounded-lg ${
            questionIndex === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-500 text-white hover:bg-gray-600"
          }`}
        >
          Previous
        </button>

        {questionIndex === totalQuestions - 1 ? (
          <button
            onClick={onSubmit}
            disabled={selectedAnswer === undefined}
            className={`px-6 py-2 rounded-lg ${
              selectedAnswer !== undefined
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
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

export default QuizQuestion;
