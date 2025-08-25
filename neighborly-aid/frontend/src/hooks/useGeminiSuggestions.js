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

  const stripEmojiAndNormalize = (str) =>
    str
      .replace(/^[^\w]+/g, "") // Remove leading non-word chars (emojis)
      .replace(/-/g, " ") // Replace hyphens with spaces
      .trim()
      .toLowerCase();

  const applySuggestions = (updateFormData, categories) => {
    if (geminiSuggestions && updateFormData && categories) {
      const primarySuggestedCategory = geminiSuggestions.suggestedCategories[0];
      const cleanSuggested = stripEmojiAndNormalize(primarySuggestedCategory);

      // Try to find a matching category
      const matchingCategory = categories.find((cat) => {
        const nameNorm = cat.name.replace(/-/g, " ").toLowerCase();
        const displayNameNorm = cat.displayName.toLowerCase();
        return (
          nameNorm === cleanSuggested || displayNameNorm === cleanSuggested
        );
      });

      updateFormData({
        category: matchingCategory?._id || `custom-${primarySuggestedCategory}`,
        customCategory: matchingCategory ? "" : primarySuggestedCategory,
        urgency: geminiSuggestions.suggestedUrgency || "",
        karmaPoints: geminiSuggestions.suggestedKarmaPoints?.toString() || "",
      });
      setSuggestionsApplied(true);
    }
  };

  // Add a new function to handle manual category selection
  const handleCategorySelection = (
    selectedValue,
    updateFormData,
    categories
  ) => {
    if (selectedValue.startsWith("custom-")) {
      // Handle custom category selection
      const categoryName = selectedValue.replace("custom-", "");
      updateFormData({
        category: selectedValue,
        customCategory: categoryName,
      });
    } else if (selectedValue) {
      // Handle existing category selection
      updateFormData({
        category: selectedValue,
        customCategory: "",
      });
    } else {
      // Handle clearing selection
      updateFormData({
        category: "",
        customCategory: "",
      });
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
    handleCategorySelection, // Add this new function
    resetSuggestions,
    resetSuggestionsApplied,
  };
};
