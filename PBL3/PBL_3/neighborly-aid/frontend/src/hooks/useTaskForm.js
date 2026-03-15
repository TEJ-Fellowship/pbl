// frontend/src/hooks/useTaskForm.js
import { useState } from "react";

export const useTaskForm = (initialData = {}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    customCategory: "",
    urgency: "",
    location: "",
    karmaPoints: "",
    ...initialData,
  });

  const [submitStatus, setSubmitStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || "",
    }));

    // Reset submit status when user makes changes
    if (submitStatus) {
      setSubmitStatus(null);
      setError(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      customCategory: "",
      urgency: "",
      location: "",
      karmaPoints: "",
    });
    setSubmitStatus(null);
    setError(null);
  };

  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return {
    formData,
    submitStatus,
    error,
    handleInputChange,
    resetForm,
    updateFormData,
    setSubmitStatus,
    setError,
  };
};
