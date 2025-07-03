import React, { useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { MapPin, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getTaskSuggestions } from "../api/geminiAPI";
import { createTask } from "../api/tasks";
import GeminiIcon from "./common/GeminiIcon";

// Submit button component that uses useFormStatus
function SubmitButton({ submitStatus }) {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-gradient-to-r from-primary-light to-primary text-background px-6 py-2 rounded-full font-medium hover:from-primary hover:to-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Posting...
        </>
      ) : submitStatus === 'success' ? (
        <>
          <CheckCircle className="w-4 h-4" />
          Posted!
        </>
      ) : (
        'Post Request'
      )}
    </button>
  );
}

const PostForm = ({ categories, handleSetShowPostForm, onTaskCreated, ensureCategoryExists }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    urgency: '',
    location: '',
    karmaPoints: ''
  });
  
  const [geminiSuggestions, setGeminiSuggestions] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsApplied, setSuggestionsApplied] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [error, setError] = useState(null);
  
  const formRef = useRef(null);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value || '' }));
    
    // Reset suggestions when user manually changes category/urgency/karmaPoints
    if ((field === 'category' || field === 'urgency' || field === 'karmaPoints') && suggestionsApplied) {
      setSuggestionsApplied(false);
    }
    
    // Reset submit status when user makes changes
    if (submitStatus) {
      setSubmitStatus(null);
      setError(null);
    }
  };

  // Get Gemini suggestions
  const handleGetSuggestions = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in both title and description to get suggestions');
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const suggestions = await getTaskSuggestions(formData.title, formData.description);
      setGeminiSuggestions(suggestions);
    } catch (err) {
      console.error('Failed to get suggestions:', err);
      alert('Failed to get AI suggestions. Please try again.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Apply Gemini suggestions - Updated to use original categories
  const applySuggestions = () => {
    if (geminiSuggestions) {
      // Find or create a matching category
      const suggestedCategoryName = geminiSuggestions.suggestedCategories[0];
      const matchingCategory = categories.find(cat => 
        cat.name === suggestedCategoryName.toLowerCase().replace(/[^a-z0-9]/g, '-') ||
        cat.displayName === suggestedCategoryName ||
        cat.displayName.toLowerCase() === suggestedCategoryName.toLowerCase()
      );
      
      setFormData(prev => ({
        ...prev,
        category: matchingCategory ? matchingCategory._id : 'custom',
        customCategory: matchingCategory ? '' : suggestedCategoryName,
        urgency: geminiSuggestions.suggestedUrgency || '',
        karmaPoints: geminiSuggestions.suggestedKarmaPoints?.toString() || ''
      }));
      setSuggestionsApplied(true);
    }
  };

  // Handle form submission using form action
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitStatus(null);
    
    try {
      // If it's a custom category or Gemini suggestion, create it first
      let categoryId = formData.category;
      if (formData.category === 'custom' || (geminiSuggestions && !categories.find(c => c._id === formData.category))) {
        const categoryName = formData.customCategory || geminiSuggestions?.suggestedCategories[0];
        if (!categoryName) {
          throw new Error('Please enter a category name');
        }
        
        try {
          const newCategoryId = await ensureCategoryExists(categoryName);
          if (!newCategoryId) {
            throw new Error('Failed to create category');
          }
          categoryId = newCategoryId;
        } catch (err) {
          console.error('Failed to create category:', err);
          throw new Error('Failed to create category: ' + err.message);
        }
      }

      // Create the task with the correct category ID
      const taskData = {
        title: formData.title,
        description: formData.description,
        category: categoryId,
        urgency: formData.urgency,
        location: formData.location,
        taskKarmaPoints: parseInt(formData.karmaPoints) || 10
      };

      const result = await createTask(taskData);
      
      if (result) {
        setSubmitStatus('success');
        
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            title: '',
            description: '',
            category: '',
            urgency: '',
            location: '',
            karmaPoints: ''
          });
          setGeminiSuggestions(null);
          setSuggestionsApplied(false);
          setSubmitStatus(null);
          handleSetShowPostForm(false);
          if (onTaskCreated) {
            onTaskCreated();
          }
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create task');
      setSubmitStatus('error');
    }
  };

  return (
    <div className="bg-background dark:bg-background-dark dark:border-border-dark rounded-2xl shadow-sm border border-border p-4 mb-4 relative">
      {/* Gemini Icon Component */}
      <div className="absolute top-4 right-4 z-10">
        <GeminiIcon
          onClick={handleGetSuggestions}
          loading={isLoadingSuggestions}
          disabled={isLoadingSuggestions}
          size="sm"
          variant="gradient"
          tooltip="Try Gemini"
          tooltipDescription="for selecting category and priority level"
          showTooltip={true}
        />
      </div>

      <h3 className="font-semibold text-text-dark dark:text-text-spotlight mb-3 pr-12">
        Request Help from Your Community
      </h3>

      {/* Enhanced Gemini Suggestions Display */}
      {geminiSuggestions && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700 animate-in slide-in-from-top duration-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <GeminiIcon size="sm" variant="solid" showTooltip={false} className="!p-1" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                  AI Suggestions
                </span>
              </div>
              
              {/* Explanation */}
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {geminiSuggestions.explanation}
              </p>
              
              {/* Suggested Categories - Show all original categories */}
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
                          ? 'bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100 font-medium ring-2 ring-purple-300 dark:ring-purple-600' 
                          : 'bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {index === 0 && '⭐ '}
                      {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                    {geminiSuggestions.suggestedUrgency.toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 block">
                    Suggested Karma Points:
                  </span>
                  <span className="text-xs bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2.5 py-1 rounded-full animate-in fade-in duration-500 delay-450 font-medium flex items-center gap-1">
                    ⭐ {geminiSuggestions.suggestedKarmaPoints} points
                  </span>
                </div>
              </div>
              
              {/* Note about direct application */}
              <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300">
                  <span className="font-medium">✨ Ready to apply: </span> "{geminiSuggestions.suggestedCategories[0]}" • {geminiSuggestions.suggestedUrgency} priority • {geminiSuggestions.suggestedKarmaPoints} karma points
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={applySuggestions}
              className="ml-4 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-200 hover:scale-105 active:scale-95 font-medium shadow-md hover:shadow-lg"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="space-y-3">
        {/* Title Input */}
        <div>
          <input
            type="text"
            name="title"
            placeholder="What do you need help with?"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
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
            onChange={(e) => handleInputChange('description', e.target.value)}
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
            onChange={(e) => handleInputChange('location', e.target.value)}
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
          onChange={(e) => handleInputChange('category', e.target.value)}
          className={`flex-1 p-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 ${
            suggestionsApplied && formData.category ? 'ring-2 ring-purple-400 border-purple-400 animate-pulse' : ''
          }`}
          required
        >
          <option value="">Select Category</option>
          
          {/* Show Gemini suggested categories first if available */}
          {geminiSuggestions && geminiSuggestions.suggestedCategories.map((category, index) => (
            <option key={`gemini-${index}`} value={category} className="font-medium text-purple-700">
              ✨ {category}
            </option>
          ))}
          
          {/* Separator if Gemini suggestions exist */}
          {geminiSuggestions && (
            <option disabled className="text-gray-400">
              ────────────────
            </option>
          )}
          
          {/* Original categories */}
          {categories
            .filter((c) => (c._id || c.id) !== "all")
            .map((cat) => (
              <option key={cat._id || cat.id} value={cat._id || cat.id}>
                {cat.icon} {cat.displayName || cat.name}
              </option>
            ))}
        </select>

           {/* Priority Select */}
          <select 
            name="urgency"
            value={formData.urgency}
            onChange={(e) => handleInputChange('urgency', e.target.value)}
            className={`flex-1 p-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 ${
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
              onChange={(e) => handleInputChange('karmaPoints', e.target.value)}
              className={`w-full pl-10 pr-3 py-3 border border-border-strong dark:border-border-dark dark:bg-background-politeDark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 ${
                suggestionsApplied && formData.karmaPoints ? 'ring-2 ring-orange-400 border-orange-400 animate-pulse' : ''
              }`}
              required
            />
          </div>

        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => handleSetShowPostForm(false)}
            className="px-6 py-2 text-text-light dark:text-text-spotlight hover:text-text-dark dark:hover:text-green-500 transition-colors duration-200"
          >
            Cancel
          </button>
          
          <SubmitButton submitStatus={submitStatus} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-in slide-in-from-bottom duration-300">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl animate-in slide-in-from-bottom duration-300">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Your request has been posted successfully!
            </span>
          </div>
        )}
      </form>
    </div>
  );
};

export default PostForm;