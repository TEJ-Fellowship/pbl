// frontend/src/hooks/useGeminiSuggestions.js
import { useState } from "react";
import { getTaskSuggestions } from "../api/geminiAPI";

export const useGeminiSuggestions = () => {
  const [geminiSuggestions, setGeminiSuggestions] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsApplied, setSuggestionsApplied] = useState(false);

  const handleGetSuggestions = async (title, description) => {
    if (!title.trim() || !description.trim()) {
      alert("Please fill in both title and description to get suggestions");
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const suggestions = await getTaskSuggestions(title, description);
      setGeminiSuggestions(suggestions);
    } catch (err) {
      console.error("Failed to get suggestions:", err);
      alert("Failed to get AI suggestions. Please try again.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const applySuggestions = (updateFormData) => {
    if (geminiSuggestions && updateFormData) {
      const primaryCategory = geminiSuggestions.suggestedCategories[0];

      updateFormData({
        category: primaryCategory || "",
        urgency: geminiSuggestions.suggestedUrgency || "",
        karmaPoints: geminiSuggestions.suggestedKarmaPoints?.toString() || "",
      });
      setSuggestionsApplied(true);
    }
  };

  const resetSuggestions = () => {
    setGeminiSuggestions(null);
    setSuggestionsApplied(false);
  };

  const resetSuggestionsApplied = () => {
    setSuggestionsApplied(false);
  };

  return {
    geminiSuggestions,
    isLoadingSuggestions,
    suggestionsApplied,
    handleGetSuggestions,
    applySuggestions,
    resetSuggestions,
    resetSuggestionsApplied,
  };
};
