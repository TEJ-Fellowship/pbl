import { useCallback, useEffect, useState } from "react";
import { dummyBooks } from "../data/dummyBooks";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function useBooks() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadBooks = useCallback(async (query = "") => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO:Simulate API delay now, will remove later
      await wait(500);

      //TODO: Dummy source now will replace with API response later
      const data = dummyBooks;

      const q = query.trim().toLowerCase();
      const filtered = q
        ? data.filter((book) => book.title.toLowerCase().includes(q))
        : data;

      setBooks(filtered);
    } catch (error) {
      setError(error.message || "Failed to load books. Please try again.");
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks(searchTerm);
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
