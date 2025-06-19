import React from 'react';
import PropTypes from 'prop-types';

const QuizViewToggle = ({ showSavedQuizzes, setShowSavedQuizzes }) => {
  return (
    <div className="flex justify-center gap-4 mb-8">
      <button
        onClick={() => setShowSavedQuizzes(false)}
        className={`px-6 py-2 rounded-lg transition-colors ${
          !showSavedQuizzes
            ? 'bg-red-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Generate Quiz
      </button>
      <button
        onClick={() => setShowSavedQuizzes(true)}
        className={`px-6 py-2 rounded-lg transition-colors ${
          showSavedQuizzes
            ? 'bg-red-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Saved Quizzes
      </button>
    </div>
  );
};

QuizViewToggle.propTypes = {
  showSavedQuizzes: PropTypes.bool.isRequired,
  setShowSavedQuizzes: PropTypes.func.isRequired,
};

export default QuizViewToggle;
