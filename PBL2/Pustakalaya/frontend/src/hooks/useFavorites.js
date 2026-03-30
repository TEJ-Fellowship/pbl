import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

export const GUEST_FAVORITES_KEY = "guest_favorites";

function userFavoritesKey(userId) {
  return `favorites_user_${userId}`;
}

function readFavoriteIdsFromStorage(storageKey) {
  let raw = null;
  try {
    raw = localStorage.getItem(storageKey);
  } catch (error) {
    console.error("Error reading favorites from localStorage:", error);
    raw = null;
  }
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error removing favorites from localStorage:", error);
    }
    return [];
  }
}

export default function useFavorites() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const userId =
    user?.id != null
      ? String(user.id)
      : user?._id != null
        ? String(user._id)
        : null;

  const storageKey = useMemo(() => {
    if (authLoading) return null;
    if (isAuthenticated && userId) return userFavoritesKey(userId);
    return GUEST_FAVORITES_KEY;
  }, [authLoading, isAuthenticated, userId]);

  const storageKeyRef = useRef(storageKey);
  useEffect(() => {
    storageKeyRef.current = storageKey;
  }, [storageKey]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);
  if (storageKey !== prevStorageKey) {
    setPrevStorageKey(storageKey);
    if (storageKey == null) {
      setFavoriteIds([]);
    } else {
      setFavoriteIds(readFavoriteIdsFromStorage(storageKey));
    }
  }

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const persist = useCallback((updater) => {
    setFavoriteIds((prev) => {
      const nextIds = typeof updater === "function" ? updater(prev) : updater;
      const key = storageKeyRef.current;
      if (key) {
        try {
          localStorage.setItem(key, JSON.stringify(nextIds));
        } catch (error) {
          console.error("Failed to save favorites to localStorage:", error);
        }
      }
      return nextIds;
    });
  }, []);

  const isFavorite = (bookId) => favoriteSet.has(String(bookId));

  const addFavorite = (bookId) => {
    const id = String(bookId);
    persist((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeFavorite = (bookId) => {
    const id = String(bookId);
    persist((prev) => prev.filter((x) => x !== id));
  };

  const toggleFavorite = (bookId) => {
    const id = String(bookId);
    persist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const clearFavorites = () => {
    setFavoriteIds([]);
    const key = storageKeyRef.current;
    if (!key) return;
    try {
      localStorage.removeItem(key);
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
