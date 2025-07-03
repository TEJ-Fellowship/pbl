// frontend/src/components/forms/TaskForm/TaskForm.jsx
import React, { useRef, useContext } from "react";
import {
  GeminiIcon,
  GeminiSuggestions,
  StatusMessage,
} from "../../../components";
import SubmitButton from "./SubmitButton";
import TaskFormFields from "./TaskFormFields";
import { useTaskForm, useGeminiSuggestions } from "../../../hooks";
import { submitTaskAction } from "../../../services";
import AuthContext from "../../../context/AuthContext";

const TaskForm = ({ categories, handleSetShowPostForm, onTaskCreated }) => {
  const formRef = useRef(null);
  const { user, refreshUser } = useContext(AuthContext); // Get logged-in user and refresh function
  console.log("user from task form", user);

  // Refresh user data when component mounts to get latest karma points
  React.useEffect(() => {
    if (user?.id) {
      refreshUser();
    }
  }, [user?.id]); // Remove refreshUser from dependencies to prevent infinite loops
  // Custom hooks
  const {
    formData,
    submitStatus,
    error,
    handleInputChange,
    resetForm,
    updateFormData,
    setSubmitStatus,
    setError,
  } = useTaskForm();

  const {
    geminiSuggestions,
    isLoadingSuggestions,
    suggestionsApplied,
    handleGetSuggestions,
    applySuggestions,
    resetSuggestions,
    resetSuggestionsApplied,
  } = useGeminiSuggestions();

  // Enhanced input change handler
  const handleInputChangeWithSuggestionReset = (field, value) => {
    handleInputChange(field, value);

    // Reset suggestions when user manually changes category/urgency/karma
    if (
      (field === "category" ||
        field === "urgency" ||
        field === "karmaPoints") &&
      suggestionsApplied
    ) {
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

  // Validate karma points
  const validateKarmaPoints = () => {
    const karmaPoints = parseInt(formData.karmaPoints) || 0;
    const userKarma = user?.karmaPoints || 0;

    if (karmaPoints > userKarma) {
      return `You only have ${userKarma} karma points, but you're trying to offer ${karmaPoints}. Please reduce the karma points or earn more karma.`;
    }

    if (karmaPoints < 10) {
      return "Minimum karma points required is 10.";
    }

    if (karmaPoints > 5000) {
      return "Maximum karma points allowed is 5000.";
    }

    return null;
  };

  // Handle form submission
  const handleSubmit = async (formDataObj) => {
    // Check if user is logged in
    if (!user) {
      setError("You must be logged in to create a task");
      setSubmitStatus("error");
      return;
    }

    // Validate karma points before submission
    const karmaError = validateKarmaPoints();
    if (karmaError) {
      setError(karmaError);
      setSubmitStatus("error");
      return;
    }

    setError(null);
    setSubmitStatus(null);

    try {
      // The user ID will be automatically included by the backend from the auth token
      const result = await submitTaskAction(formDataObj);

      if (result.success) {
        setSubmitStatus("success");

        // Refresh user data to get updated karma points
        await refreshUser();

        // Reset form after successful submission
        setTimeout(() => {
          resetForm();
          resetSuggestions();
          handleSetShowPostForm(false);
          // Call the success callback to refresh tasks
          if (onTaskCreated) {
            onTaskCreated();
          }
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Failed to create task");
      setSubmitStatus("error");
    }
  };

  // Show login message if user is not authenticated
  if (!user) {
    return (
      <div className="bg-background dark:bg-background-dark dark:border-border-dark rounded-2xl shadow-sm border border-border p-6 mb-4 text-center">
        <h3 className="font-semibold text-text-dark dark:text-text-spotlight mb-2">
          Please Log In
        </h3>
        <p className="text-text-light dark:text-text-spotlight/70 mb-4">
          You need to be logged in to create a help request.
        </p>
        <button
          onClick={() => handleSetShowPostForm(false)}
          className="bg-gradient-to-r from-primary-light to-primary text-white px-6 py-2 rounded-full font-medium hover:from-primary hover:to-primary-dark transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

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

      {/* User Info Display */}
      <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Posting as:{" "}
          <span className="font-medium text-text-dark dark:text-text-spotlight">
            {user.name}
          </span>{" "}
          • Available karma:{" "}
          <span className="font-medium text-orange-600 dark:text-orange-400">
            {user.karmaPoints || 0} ⭐
          </span>
        </p>
      </div>

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
          user={user}
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

          <SubmitButton
            submitStatus={submitStatus}
            formData={formData}
            user={user}
          />
        </div>

        {/* Status Messages */}
        <StatusMessage error={error} submitStatus={submitStatus} />
      </form>
    </div>
  );
};

export default TaskForm;
