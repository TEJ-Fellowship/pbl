import { useState, useEffect } from "react";
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  removeRecentSearch,
} from "../utils/localStorage";

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recent searches when hook initializes
  useEffect(() => {
    const loadRecentSearches = () => {
      try {
        const searches = getRecentSearches();
        setRecentSearches(searches);
      } catch (error) {
        console.error("Failed to load recent searches:", error);
        setRecentSearches([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentSearches();
  }, []);

  // Add a new search to recent searches
  const addRecentSearch = (city) => {
    if (!city || typeof city !== "string") return;

    try {
      const updatedSearches = saveRecentSearch(city.trim());
      setRecentSearches(updatedSearches);
    } catch (error) {
      console.error("Failed to save recent search:", error);
    }
  };

  // Remove a specific search from recent searches
  const removeSearch = (city) => {
    try {
      const updatedSearches = removeRecentSearch(city);
      setRecentSearches(updatedSearches);
    } catch (error) {
      console.error("Failed to remove recent search:", error);
    }
  };

  // Clear all recent searches
  const clearAllSearches = () => {
    try {
      clearRecentSearches();
      setRecentSearches([]);
    } catch (error) {
      console.error("Failed to clear recent searches:", error);
    }
  };

  return {
    recentSearches,
    isLoading,
    addRecentSearch,
    removeSearch,
    clearAllSearches,
    hasSearches: recentSearches.length > 0,
  };
};
