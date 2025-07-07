// frontend/src/components/myNeighbourhood/TaskFormFields.jsx
import React from "react";
import { MapPin } from "lucide-react";

const TaskFormFields = ({
  formData,
  onInputChange,
  categories,
  geminiSuggestions,
  suggestionsApplied,
  user,
}) => {
  return (
    <div className="space-y-3">
      {/* Title Input */}
      <div>
        <input
          type="text"
          name="title"
          placeholder="What do you need help with?"
          value={formData.title}
          onChange={(e) => onInputChange("title", e.target.value)}
          className="w-full p-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
          required
        />
      </div>

      {/* Description Input */}
      <div>
        <textarea
          name="description"
          placeholder="Describe your request in detail..."
          rows="3"
          value={formData.description}
          onChange={(e) => onInputChange("description", e.target.value)}
          className="w-full p-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all duration-200"
          required
        />
      </div>

      {/* Location Input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200" />
        <input
          type="text"
          name="location"
          placeholder="Enter your location (e.g., Downtown, 123 Main St)"
          value={formData.location}
          onChange={(e) => onInputChange("location", e.target.value)}
          className="w-full pl-10 pr-3 py-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
          required
        />
      </div>

      {/* Category, Priority, and Karma Points Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Enhanced Category Select/Input */}
        <div className="relative">
          {formData.category === "custom" || (formData.category && formData.category.startsWith("custom-")) ? (
            // Show text input for custom category
            <div className="relative">
              <input
                type="text"
                name="customCategory"
                placeholder="Enter new category name..."
                value={formData.customCategory || (formData.category?.startsWith("custom-") ? formData.category.replace("custom-", "") : "")}
                onChange={(e) => onInputChange('customCategory', e.target.value)}
                className="w-full p-3 border border-green-500 dark:border-green-400 bg-white dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                required
                autoFocus
              />
              {/* Back to dropdown button */}
              <button
                type="button"
                onClick={() => {
                  onInputChange('category', '');
                  onInputChange('customCategory', '');
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                title="Back to categories"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            // Show dropdown for existing categories
            <select 
              name="category"
              value={formData.category}
              onChange={(e) => {
                const selectedValue = e.target.value;
                if (selectedValue === "custom" || selectedValue.startsWith('custom-')) {
                  // Handle custom category selection
                  const categoryName = selectedValue.startsWith('custom-') ? selectedValue.replace('custom-', '') : '';
                  onInputChange('category', selectedValue);
                  onInputChange('customCategory', categoryName);
                } else {
                  // Handle existing category selection
                  onInputChange('category', selectedValue);
                  onInputChange('customCategory', '');
                }
              }}
              className={`w-full p-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 ${
                suggestionsApplied && formData.category ? 'ring-2 ring-purple-400 border-purple-400 animate-pulse' : ''
              }`}
              required
            >
              <option value="">Select Category</option>
              
              {/* AI Suggested Categories */}
              {geminiSuggestions?.suggestedCategories?.map((suggestion, idx) => {
                const cleanSuggestion = suggestion.replace(/^[^\w]+/g, "").replace(/-/g, " ").trim().toLowerCase();
                const match = categories.find(cat =>
                  cat.name.replace(/-/g, " ").toLowerCase() === cleanSuggestion ||
                  cat.displayName.toLowerCase() === cleanSuggestion
                );
                
                if (match) {
                  // Existing category - show with AI suggestion highlight (only AI icon, no category icon)
                  return (
                    <option key={`gemini-${match._id}`} value={match._id} className="font-medium bg-purple-50 dark:bg-purple-900/20">
                      ⭐ {match.displayName} (AI Suggested)
                    </option>
                  );
                } else {
                  // New category - show as custom option (only AI icon, clean text)
                  const cleanDisplayText = suggestion
                    .replace(/^[^\w]+/g, "") // Remove leading emojis
                    .replace(/-/g, " ")      // Replace hyphens with spaces
                    .trim();                 // Remove extra spaces
                  
                  return (
                    <option key={`gemini-custom-${idx}`} value={`custom-${suggestion}`} className="font-medium text-green-600">
                      ⭐ {cleanDisplayText} (Create New)
                    </option>
                  );
                }
              })}
              
              {/* Separator if AI suggestions exist */}
              {geminiSuggestions && (
                <option disabled className="text-gray-400">
                  ─────── All Categories ───────
                </option>
              )}
              
              {/* All existing categories */}
              {categories
                .filter((c) => c._id !== "all")
                .map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon} {cat.displayName}
                  </option>
                ))}
              
              {/* General custom category option */}
              <option disabled className="text-gray-400">
                ────── Create New ──────
              </option>
              <option value="custom" className="font-medium text-green-600">
                ➕ Create New Category
              </option>
            </select>
          )}
          
          {/* Helper text for custom category - positioned absolutely to not affect layout */}
          {/* {(formData.category === "custom" || (formData.category && formData.category.startsWith("custom-"))) && (
            <div className="absolute -bottom-6 left-0 text-xs text-green-600 dark:text-green-400">
              💡 This will create a new category that others can use too!
            </div>
          )} */}
        </div>

        {/* Priority Select */}
        <select
          name="urgency"
          value={formData.urgency}
          onChange={(e) => onInputChange("urgency", e.target.value)}
          className={`p-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 ${
            suggestionsApplied && formData.urgency
              ? "ring-2 ring-purple-400 border-purple-400 animate-pulse"
              : ""
          }`}
          required
        >
          <option value="">Priority Level</option>
          <option value="low">Low - No rush</option>
          <option value="medium">Medium - Soon</option>
          <option value="high">High - Urgent</option>
        </select>

        {/* Karma Points Input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 font-bold">
            ⭐
          </span>
          <input
            type="number"
            name="karmaPoints"
            placeholder="Karma Points"
            min="10"
            max="5000"
            value={formData.karmaPoints}
            onChange={(e) => onInputChange("karmaPoints", e.target.value)}
            className={`w-full pl-10 pr-24 py-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 ${
              suggestionsApplied && formData.karmaPoints
                ? "ring-2 ring-orange-400 border-orange-400 animate-pulse"
                : ""
            }`}
            required
          />
          {/* User Karma Display */}
          {user && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1 rounded">
              {user.availableKarmaPoints || user.karmaPoints || 0} ⭐
            </div>
          )}
        </div>
      </div>

      {/* Karma Points Helper Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
        💡 Karma Points Guide: Simple tasks (10-50) • Regular tasks (51-200) •
        Complex tasks (201-800) • Major tasks (801-2000) • Emergency tasks
        (2001-5000)
      </div>

      {/* Karma Validation Feedback */}
      {user && formData.karmaPoints && (
        <div className="px-1">
          {(() => {
            const karmaPoints = parseInt(formData.karmaPoints) || 0;
            const userAvailableKarma = user.availableKarmaPoints || user.karmaPoints || 0;

            if (karmaPoints > userAvailableKarma) {
              return (
                <div className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>
                    You only have {userAvailableKarma} available karma points. Please reduce the
                    amount.
                  </span>
                </div>
              );
            } else if (karmaPoints < 10) {
              return (
                <div className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Minimum karma points required is 10.</span>
                </div>
              );
            } else if (karmaPoints > 5000) {
              return (
                <div className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Maximum karma points allowed is 5000.</span>
                </div>
              );
            } else {
              return (
                <div className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1">
                  <span>✅</span>
                  <span>
                    Valid karma amount. You'll have {userAvailableKarma - karmaPoints}{" "}
                    available karma points remaining.
                  </span>
                </div>
              );
            }
          })()}
        </div>
      )}
    </div>
  );
};

export default TaskFormFields;
