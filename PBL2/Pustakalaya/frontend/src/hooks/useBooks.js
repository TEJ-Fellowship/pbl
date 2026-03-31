import { useCallback, useEffect, useRef, useState } from "react";

const SEARCH_DEBOUNCE_MS = 350;

export default function useBooks() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Prevent race conditions when multiple requests resolve out of order
  const requestIdRef = useRef(0);

  const loadBooks = useCallback(async (query = "") => {
    const requestId = ++requestIdRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const q = query.trim();
      const params = new URLSearchParams();
      if (q) params.set("q", q);

      const response = await fetch(`/api/books?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load books. Please try again.");
      }

      const data = await response.json();

      // Only apply the latest request result
      if (requestId === requestIdRef.current) {
        setBooks(Array.isArray(data?.books) ? data.books : []);
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setError(error.message || "Failed to load books. Please try again.");
        setBooks([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBooks(searchTerm);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm, loadBooks]);

  const reload = useCallback(() => {
    loadBooks(searchTerm);
  }, [loadBooks, searchTerm]);

  return {
    books,
    searchTerm,
    setSearchTerm,
    isLoading,
    error,
    reload,
  };
}
