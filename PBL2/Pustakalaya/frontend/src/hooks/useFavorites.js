import { useMemo, useState } from "react";

const FAVORITES_KEY = "guest_favorites";

/**
* Safely retrieves and cleans the user's favorite IDs from local storage.
* - Parses text into an Array; returns [] if empty or broken.
* - Ensures all IDs are Strings; wipes storage if data is corrupted.
*/
function getInitialFavoriteIds() {
  let raw = null;
  try {
    raw = localStorage.getItem(FAVORITES_KEY);
  } catch (error) {
    console.error("Error reading favorites from localStorage:", error);
    raw = null;
  }
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    //parsed.map(String): ensures every item in the list is a String. If the list was [1, 2], it becomes ["1", "2"]
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    try {
      localStorage.removeItem(FAVORITES_KEY);
    } catch (error) {
      console.error("Error removing favorites from localStorage:", error);
    }
    return [];
  }
}

export default function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(getInitialFavoriteIds);

  //set - fast lookup, no duplicates 
  //useMemo - remember the result of the function call and only recompute it if the dependencies change
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  //updates the screen and the localStorage
  const persist = (updater) => {
    setFavoriteIds((prev) => {
      const nextIds = typeof updater === "function" ? updater(prev) : updater;

      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextIds));
      } catch (error) {
        console.error("Failed to save favorites to localStorage:", error);
      }

      return nextIds;
    });
  };

  //checks if the book is in the favorites list
  const isFavorite = (bookId) => favoriteSet.has(String(bookId));

  // adds a book to the favorites list, also makes sure there are no duplicates
  const addFavorite = (bookId) => {
    const id = String(bookId);
    persist((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  // Removes one specific book from the favorites list
  const removeFavorite = (bookId) => {
    const id = String(bookId);
    persist((prev) => prev.filter((x) => x !== id));
  };

  // Switches a book between favorited and unfavorited states
  const toggleFavorite = (bookId) => {
    const id = String(bookId);
    persist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Completely wipes all saved favorites and clears storage
  const clearFavorites = () => {
    setFavoriteIds([]);
    try {
      localStorage.removeItem(FAVORITES_KEY);
    } catch (error) {
      console.error("Error clearing favorites from localStorage:", error);
    }
  };

  return {
    favoriteIds,
    favoriteSet,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
  };
}
