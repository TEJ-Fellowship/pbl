// frontend/src/components/myNeighbourhood/TaskFormFields.jsx
import React from 'react';
import { MapPin } from 'lucide-react';

const TaskFormFields = ({ 
  formData, 
  onInputChange, 
  categories, 
  geminiSuggestions, 
  suggestionsApplied 
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
          onChange={(e) => onInputChange('title', e.target.value)}
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
          onChange={(e) => onInputChange('description', e.target.value)}
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
          onChange={(e) => onInputChange('location', e.target.value)}
          className="w-full pl-10 pr-3 py-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
          required
        />
      </div>

      {/* Category, Priority, and Karma Points Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Category Select */}
        <select 
          name="category"
          value={formData.category}
          onChange={(e) => onInputChange('category', e.target.value)}
          className={`p-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 ${
            suggestionsApplied && formData.category ? 'ring-2 ring-purple-400 border-purple-400 animate-pulse' : ''
          }`}
          required
        >
          <option value="">Select Category</option>
          
          {/* Show Gemini suggested categories first if available */}
          {geminiSuggestions && geminiSuggestions.suggestedCategories.map((category, index) => (
            <option key={`gemini-${index}`} value={category} className="font-medium">
              ✨ {category}
            </option>
          ))}
          
          {/* Separator if Gemini suggestions exist */}
          {geminiSuggestions && (
            <option disabled className="text-gray-400">
              ────── Original Categories ──────
            </option>
          )}
          
          {/* Original categories */}
          {categories
            .filter((c) => c.id !== "all")
            .map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
        </select>
        
        {/* Priority Select */}
        <select 
          name="urgency"
          value={formData.urgency}
          onChange={(e) => onInputChange('urgency', e.target.value)}
          className={`p-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 ${
            suggestionsApplied && formData.urgency ? 'ring-2 ring-purple-400 border-purple-400 animate-pulse' : ''
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
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 font-bold">⭐</span>
          <input
            type="number"
            name="karmaPoints"
            placeholder="Karma Points"
            min="10"
            max="5000"
            value={formData.karmaPoints}
            onChange={(e) => onInputChange('karmaPoints', e.target.value)}
            className={`w-full pl-10 pr-3 py-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 ${
              suggestionsApplied && formData.karmaPoints ? 'ring-2 ring-orange-400 border-orange-400 animate-pulse' : ''
            }`}
            required
          />
        </div>
      </div>

      {/* Karma Points Helper Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
        💡 Karma Points Guide: Simple tasks (10-50) • Regular tasks (51-200) • Complex tasks (201-800) • Major tasks (801-2000) • Emergency tasks (2001-5000)
      </div>
    </div>
  );
};

export default TaskFormFields;