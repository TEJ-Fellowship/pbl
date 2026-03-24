import { useMemo, useState } from "react";

const FAVORITES_KEY = "guest_favorites";

function getInitialFavoriteIds() {
  const raw = localStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    //parsed.map(String): ensures every item in the list is a String. If the list was [1, 2], it becomes ["1", "2"]
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    localStorage.removeItem(FAVORITES_KEY);
    return [];
  }
}

export default function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(getInitialFavoriteIds);

  //set - fast lookup, no duplicates , 
  //useMemo - remember the result of the function call and only recompute it if the dependencies change
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  //updates the screen and the localStorage
  const persist = (nextIds) => {
    setFavoriteIds(nextIds);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextIds));
  };

  //checks if the book is in the favorites list
  const isFavorite = (bookId) => favoriteSet.has(String(bookId));

  // Checks if a book is already favorited and adds it if it's missing
  const addFavorite = (bookId) => {
    if (isFavorite(bookId)) return;
    persist([...favoriteIds, String(bookId)]);
  };

// Removes one specific book from the favorites list
  const removeFavorite = (bookId) => {
    const id = String(bookId);
    if (!isFavorite(bookId)) return;
    persist(favoriteIds.filter((x) => x !== id));
  };

  // Switches a book between favorited and unfavorited states
  const toggleFavorite = (bookId) => {
    if (isFavorite(bookId)) {
      removeFavorite(bookId);
    } else {
      addFavorite(bookId);
    }
  };

  // Completely wipes all saved favorites and clears storage
  const clearFavorites = () => {
    setFavoriteIds([]);
    localStorage.removeItem(FAVORITES_KEY);
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
