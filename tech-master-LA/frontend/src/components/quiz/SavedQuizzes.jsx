// tech-master-LA/frontend/src/components/Quiz/SavedQuizzes.jsx
import React from "react";
import { motion } from "framer-motion";

const SavedQuizzes = ({ quizzes = [], onRetake, isLoading = false }) => {
  // Sort quizzes by createdAt in descending order (newest first)
  // Handle cases where createdAt might not exist (use attempt dates as fallback)
  const sortedQuizzes = [...quizzes].sort((a, b) => {
    const dateA = a.createdAt || (a.attempts?.[0]?.date) || new Date(0);
    const dateB = b.createdAt || (b.attempts?.[0]?.date) || new Date(0);
    return new Date(dateB) - new Date(dateA);
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    // If the date is today, show time
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // If the date is yesterday, show "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // For other dates, show the full date
    return date.toLocaleDateString(undefined, { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRetake = (quizId) => {
    // First scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Then call the original onRetake
    onRetake(quizId);
  };

  if (isLoading) {
    return (
      <div className="p-4 w-full max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          📚 Saved Quizzes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white shadow-lg rounded-lg p-4 animate-pulse"
            >
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="mt-4 h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="p-4 w-full max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          📚 Saved Quizzes
        </h2>
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg mb-2">No quizzes saved yet!</p>
          <p className="text-gray-400">
            Generate a new quiz to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-sm bg-gray-900/90 border border-gray-800/50 rounded-3xl p-8 shadow-2xl">
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 w-full max-w-6xl mx-auto"
    >
      <h2 className="text-2xl font-bold text-white mb-6">
        📚 Saved Quizzes
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedQuizzes.map((quiz, index) => (
          <motion.div
            key={quiz._id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-lg rounded-lg p-4 flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:border-gray-600/50"
          >
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {quiz.title}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 rounded-full text-sm font-medium">
                  {quiz.topic}
                </span>
                <span className="text-sm text-gray-500">
                  {quiz.questions?.length || 0} questions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Last Score: </span>
                {quiz.attempts && quiz.attempts.length > 0 ? (
                  <span className={`font-medium ${
                    quiz.attempts[quiz.attempts.length - 1].score >= 70
                      ? 'text-green-600'
                      : quiz.attempts[quiz.attempts.length - 1].score >= 40
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {quiz.attempts[quiz.attempts.length - 1].score}%
                  </span>
                ) : (
                  <span className="text-sm text-gray-400 italic">
                    Not attempted yet
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
                <div>
                  Created: {formatDate(quiz.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{quiz.createdBy || 'Anonymous'}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {quiz.attempts?.length || 0} attempts
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRetake(quiz._id)}
                className={`${
                  quiz.attempts?.length === 0
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600'
                } text-white px-6 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl border border-white/10`}
              >
                {quiz.attempts?.length === 0 ? (
                  // Play icon for first attempt
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  // Refresh icon for retakes
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <span>{quiz.attempts?.length === 0 ? "Start Quiz" : "Retake Quiz"}</span>
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
    </div>
  );
};

export default SavedQuizzes;