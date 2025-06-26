// frontend/src/components/myNeighbourhood/PostForm.jsx
import React, { useRef } from 'react';
import { GeminiIcon, GeminiSuggestions, StatusMessage } from '../../../components';
import  SubmitButton  from './SubmitButton';
import  TaskFormFields  from './TaskFormFields';
import { useTaskForm ,useGeminiSuggestions} from '../../../hooks';
import { submitTaskAction } from '../../../services';

const PostForm = ({ categories, handleSetShowPostForm }) => {
  const formRef = useRef(null);
  
  // Custom hooks
  const {
    formData,
    submitStatus,
    error,
    handleInputChange,
    resetForm,
    updateFormData,
    setSubmitStatus,
    setError
  } = useTaskForm();

  const {
    geminiSuggestions,
    isLoadingSuggestions,
    suggestionsApplied,
    handleGetSuggestions,
    applySuggestions,
    resetSuggestions,
    resetSuggestionsApplied
  } = useGeminiSuggestions();

  // Enhanced input change handler
  const handleInputChangeWithSuggestionReset = (field, value) => {
    handleInputChange(field, value);
    
    // Reset suggestions when user manually changes category/urgency/karma
    if ((field === 'category' || field === 'urgency' || field === 'karmaPoints') && suggestionsApplied) {
      resetSuggestionsApplied();
    }
  };

  // Handle Gemini suggestions
  const handleGeminiClick = () => {
    handleGetSuggestions(formData.title, formData.description);
  };

  // Handle applying suggestions
  const handleApplySuggestions = () => {
    applySuggestions(updateFormData);
  };

  // Handle form submission
  const handleSubmit = async (formDataObj) => {
    setError(null);
    setSubmitStatus(null);
    
    try {
      const result = await submitTaskAction(formDataObj);
      
      if (result.success) {
        setSubmitStatus('success');
        
        // Reset form after successful submission
        setTimeout(() => {
          resetForm();
          resetSuggestions();
          handleSetShowPostForm(false);
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
          onClick={handleGeminiClick}
          loading={isLoadingSuggestions}
          disabled={isLoadingSuggestions}
          size="sm"
          variant="gradient"
          tooltip="Try Gemini"
          tooltipDescription="for selecting category, priority and karma points"
          showTooltip={true}
        />
      </div>

      <h3 className="font-semibold text-text-dark dark:text-text-spotlight mb-3 pr-12">
        Request Help from Your Community
      </h3>

      {/* Gemini Suggestions Display */}
      <GeminiSuggestions 
        geminiSuggestions={geminiSuggestions}
        onApplySuggestions={handleApplySuggestions}
      />

      <form ref={formRef} action={handleSubmit} className="space-y-3">
        {/* Form Fields */}
        <TaskFormFields
          formData={formData}
          onInputChange={handleInputChangeWithSuggestionReset}
          categories={categories}
          geminiSuggestions={geminiSuggestions}
          suggestionsApplied={suggestionsApplied}
        />

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

        {/* Status Messages */}
        <StatusMessage error={error} submitStatus={submitStatus} />
      </form>
    </div>
  );
};

export default PostForm;