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

  const applySuggestions = (updateFormData, categories) => {
    if (geminiSuggestions && updateFormData && categories) {
      const primarySuggestedCategory = geminiSuggestions.suggestedCategories[0];

      // Find the matching category from our categories list
      const matchingCategory = categories.find(
        (cat) =>
          cat.displayName === primarySuggestedCategory ||
          cat.name === primarySuggestedCategory ||
          primarySuggestedCategory.includes(cat.displayName)
      );

      updateFormData({
        category: matchingCategory?._id || "", // Use the category ID instead of name
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
