// frontend/src/components/myNeighbourhood/GeminiSuggestions.jsx
import React from "react";
import GeminiIcon from "../../common/GeminiIcon";

const GeminiSuggestions = ({
  geminiSuggestions,
  onApplySuggestions,
  className = "",
}) => {
  if (!geminiSuggestions) return null;

  return (
    <div
      className={`mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700 animate-in slide-in-from-top duration-300 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <GeminiIcon
              size="sm"
              variant="solid"
              showTooltip={false}
              className="!p-1"
            />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
              AI Suggestions
            </span>
          </div>

          {/* Explanation */}
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            {geminiSuggestions.explanation}
          </p>

          {/* Suggested Categories */}
          <div className="mb-3">
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2 block">
              Suggested Categories:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {geminiSuggestions.suggestedCategories.map((category, index) => (
                <span
                  key={index}
                  className={`text-xs px-2.5 py-1 rounded-full animate-in fade-in duration-500 ${
                    index === 0
                      ? "bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100 font-medium ring-2 ring-purple-300 dark:ring-purple-600"
                      : "bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {index === 0 && "⭐ "}
                  {category}
                </span>
              ))}
            </div>
          </div>

          {/* Suggested Priority and Karma Points */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <span className="text-xs font-medium text-pink-700 dark:text-pink-300 mb-2 block">
                Suggested Priority:
              </span>
              <span className="text-xs bg-pink-100 dark:bg-pink-800 text-pink-800 dark:text-pink-200 px-2.5 py-1 rounded-full animate-in fade-in duration-500 delay-300 font-medium">
                {geminiSuggestions.suggestedUrgency?.toUpperCase() || "MEDIUM"}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
                Suggested Karma Points:
              </span>
              <span className="text-xs bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2.5 py-1 rounded-full animate-in fade-in duration-500 delay-450 font-medium flex items-center gap-1">
                ⭐ {geminiSuggestions.suggestedKarmaPoints || 100} points
              </span>
            </div>
          </div>

          {/* Note about direct application */}
          <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-300">
              <span className="font-medium">✨ Ready to apply:</span> "
              {geminiSuggestions.suggestedCategories[0]}" •{" "}
              {geminiSuggestions.suggestedUrgency} priority •{" "}
              {geminiSuggestions.suggestedKarmaPoints} karma points
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onApplySuggestions}
          className="ml-4 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-200 hover:scale-105 active:scale-95 font-medium shadow-md hover:shadow-lg"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default GeminiSuggestions;
