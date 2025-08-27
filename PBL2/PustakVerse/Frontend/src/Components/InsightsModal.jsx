import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
const InsightsModal = ({ book, onClose }) => {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:3001/api/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: book.title,
            author: book.author,
            description: book.description,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch insights");
        }

        const data = await response.json();
        setInsights(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [book]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              AI Insights: {book.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          {isLoading && (
            <div className="flex flex-col space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          )}
          {error && (
            <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded">
              Error: {error}. Please try again later.
            </div>
          )}
          {insights && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-purple-600 dark:text-purple-400 mb-2">
                  Key Themes
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {insights.keyThemes.map((theme, index) => (
                    <li
                      key={index}
                      className="text-gray-700 dark:text-gray-300"
                    >
                      {theme}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-purple-600 dark:text-purple-400 mb-2">
                  Author's Approach
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {insights.authorsApproach}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-purple-600 dark:text-purple-400 mb-2">
                  Why Read This Book
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {insights.whyRead}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-purple-600 dark:text-purple-400 mb-2">
                  Reading Experience
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {insights.readingExperience}
                </p>
              </div>
            </div>
          )}
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded text-sm text-gray-600 dark:text-gray-400">
            <p className="font-semibold">Disclaimer:</p>
            <p>
              These insights are AI-generated and intended for educational
              purposes only. They do not substitute for reading the original
              work. Support authors by purchasing their books.
            </p>
          </div>

          {insights && (
            <Link
              to={`/insights/${book._id || book.googleId}`}
              className="inline-block mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              onClick={onClose} // Close modal when navigating to detailed page
            >
              View Detailed Analysis
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsModal;
