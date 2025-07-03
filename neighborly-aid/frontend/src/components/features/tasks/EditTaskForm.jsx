import React, { useContext } from "react";
import { X } from "lucide-react";
import { useTaskForm } from "../../../hooks/useTaskForm";
import TaskFormFields from "../../forms/TaskForm/TaskFormFields";
import AuthContext from "../../../context/AuthContext";

const EditTaskForm = ({ task, categories, onUpdate, onCancel, isLoading }) => {
  const { user } = useContext(AuthContext);

  // Initialize form with current task data
  const initialData = {
    title: task.title || "",
    description: task.description || "",
    category: task.category || "",
    urgency: task.urgency || "",
    location: task.location || "",
    karmaPoints: task.karma?.toString() || "",
  };

  const {
    formData,
    submitStatus,
    error,
    handleInputChange,
    setSubmitStatus,
    setError,
  } = useTaskForm(initialData);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.urgency ||
      !formData.location ||
      !formData.karmaPoints
    ) {
      setError("All fields are required");
      setSubmitStatus("error");
      return;
    }

    // Validate karma points
    const karmaPoints = parseInt(formData.karmaPoints) || 0;
    const userKarma = user?.karmaPoints || 0;
    const currentTaskKarma = task.karma || 0;
    const availableKarma = userKarma + currentTaskKarma; // Available karma + current task karma

    if (karmaPoints > availableKarma) {
      setError(
        `Insufficient karma points. You have ${userKarma} available karma plus ${currentTaskKarma} from this task. Total available: ${availableKarma}, Required: ${karmaPoints}`
      );
      setSubmitStatus("error");
      return;
    }

    if (karmaPoints < 10) {
      setError("Minimum karma points required is 10");
      setSubmitStatus("error");
      return;
    }

    if (karmaPoints > 5000) {
      setError("Maximum karma points allowed is 5000");
      setSubmitStatus("error");
      return;
    }

    setError(null);
    setSubmitStatus(null);

    // Prepare update data
    const updateData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      urgency: formData.urgency,
      location: formData.location,
      taskKarmaPoints: karmaPoints,
    };

    // Call the update function
    await onUpdate(updateData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form Fields */}
      <TaskFormFields
        formData={formData}
        onInputChange={handleInputChange}
        categories={categories}
        user={user}
      />

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success Message */}
      {submitStatus === "success" && (
        <div className="text-green-500 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          Task updated successfully!
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Updating...</span>
            </>
          ) : (
            <span>Update Task</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default EditTaskForm;
