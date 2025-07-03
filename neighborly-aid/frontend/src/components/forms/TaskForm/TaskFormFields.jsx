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
        {/* Enhanced Category Select with Custom Option */}
        <div className="relative">
          <select 
            name="category"
            value={formData.category}
            onChange={(e) => onInputChange('category', e.target.value)}
            className={`w-full p-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 ${
             // Add animation when suggestions are applied and a category matches the AI suggestion
             suggestionsApplied && geminiSuggestions?.suggestedCategories?.some(suggestion => 
              categories.find(cat => cat._id === formData.category)?.displayName === suggestion
            ) ? 'ring-2 ring-purple-400 border-purple-400 animate-pulse' : ''
            }`}
            required
          >
            <option value="">Select Category</option>
            
            {/* Original categories - updated for new database structure */}
            {categories
              .filter((c) => c._id !== "all")
              .map((cat) => {
                // Check if this category was suggested by Gemini
                const isGeminiSuggested = geminiSuggestions && 
                  geminiSuggestions.suggestedCategories.some(suggestion => 
                    suggestion.toLowerCase().replace(/[^a-z0-9]/g, '-') === cat.name ||
                    suggestion === cat.name ||
                    suggestion.includes(cat.displayName)
                  );
                
                // Create display text with usage information
                let displayText = `${cat.icon} ${cat.displayName}`;
                if (isGeminiSuggested) displayText = `⭐ ${displayText} (AI Suggested)`;
                if (cat.count > 0) displayText += ` (${cat.count} used)`;
                
                return (
                  <option 
                    key={cat._id} 
                    value={cat._id}
                    className={isGeminiSuggested ? 'font-medium bg-purple-50 dark:bg-purple-900/20' : ''}
                  >
                    {displayText}
                  </option>
                );
              })}
            
            {/* Custom category option */}
            <option disabled className="text-gray-400">
              ────── Create New ──────
            </option>
            <option value="custom" className="font-medium text-green-600">
              ➕ Create New Category
            </option>
          </select>
          
          {/* Custom category input - show when "custom" is selected */}
          {formData.category === "custom" && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10">
              <input
                type="text"
                placeholder="Enter new category name..."
                className="w-full p-3 border border-green-500 dark:border-green-400 bg-white dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg"
                onChange={(e) => onInputChange('customCategory', e.target.value)}
                value={formData.customCategory || ''}
                autoFocus
              />
              <div className="text-xs text-green-600 dark:text-green-400 mt-1 px-1">
                💡 This will create a new category that others can use too!
              </div>
            </div>
          )}
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
              {user.karmaPoints || 0} ⭐
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
            const userKarma = user.karmaPoints || 0;

            if (karmaPoints > userKarma) {
              return (
                <div className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>
                    You only have {userKarma} karma points. Please reduce the
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
                    Valid karma amount. You'll have {userKarma - karmaPoints}{" "}
                    karma points remaining.
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
