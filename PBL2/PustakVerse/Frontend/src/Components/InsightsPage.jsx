// Components/InsightsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { authFetch, handleApiError } from "../utils/api"; // Import the utility functions

const InsightsPage = ({ books }) => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const book = books.find((b) => b._id === bookId || b.googleId === bookId);

  useEffect(() => {
    if (!book) return;

    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use authFetch for authenticated requests
        const response = await authFetch(
          "http://localhost:3001/api/summarize",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: book.title,
              author: book.author,
              description: book.description,
            }),
          }
        );

        // Handle API errors
        await handleApiError(response);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch insights");
        }

        setInsights(data);
      } catch (err) {
        console.error("Error fetching insights:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [book]);

  if (!book) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Book Not Found
          </h1>
          <Link to="/" className="text-blue-500 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-blue-500 hover:underline mb-6"
      >
        ← Back
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {book.coverImage || book.coverUrl ? (
            <img
              src={
                book.coverImage
                  ? `http://localhost:3001/uploads/${book.coverImage}`
                  : book.coverUrl
              }
              alt={book.title}
              className="w-48 h-72 object-cover rounded-lg shadow-md"
            />
          ) : (
            <div className="w-48 h-72 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg">
              <span className="text-gray-500">No Cover</span>
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {book.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
              by {book.author}
            </p>

            {/* ADDED: Book details section */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {book.year && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                    Published
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {book.year}
                  </p>
                </div>
              )}

              {book.rating && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                    Rating
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    ⭐ {book.rating}/5
                  </p>
                </div>
              )}

              {book.genre && book.genre.length > 0 && (
                <div className="col-span-2">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                    Genres
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {book.genre.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ADDED: Full description */}
            {book.description && (
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {book.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            AI-Generated Insights
          </h2>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        )}

        {insights && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">
                Key Themes
              </h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                {insights.keyThemes.map((theme, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300">
                    {theme}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">
                Author's Approach
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {insights.authorsApproach}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">
                Why Read This Book
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {insights.whyRead}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">
                Reading Experience
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {insights.readingExperience}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded text-sm text-gray-600 dark:text-gray-400">
        <p className="font-semibold">Disclaimer:</p>
        <p>
          These AI-generated insights from Pustakverse are for educational
          purposes only and do not replace reading the original work. Support
          authors by purchasing their books.
        </p>
      </div>
    </div>
  );
};

export default InsightsPage;
