// Components/BookGrid.jsx
import React, { useState } from "react";
import BookCard from "./BookCard";
import BookModal from "./BookModal";
import Form from "./Form";

const BookGrid = ({ books, setBooks }) => {
  const [selectedBook, setSelectedBook] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Handle edit book - only for manually added books
  const handleEdit = (book) => {
    if (book.source === "online" || book.googleId) {
      alert(
        "Books from Google Books cannot be edited. You can only mark them as favorites or delete them."
      );
      return;
    }
    setEditingBook(book);
    setShowEditForm(true);
  };

  // Handle delete book - now available for ALL books
  const handleDelete = async (book) => {
    // Different confirmation messages for online vs manual books
    const isOnlineBook = book.source === "online" || book.googleId;
    const confirmMessage = isOnlineBook
      ? `Are you sure you want to remove "${book.title}" from your collection?`
      : `Are you sure you want to delete "${book.title}"?`;

    if (window.confirm(confirmMessage)) {
      try {
        const res = await fetch(`http://localhost:3001/api/books/${book._id}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Failed to delete book");

        setBooks((prev) => prev.filter((b) => b._id !== book._id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete book. Check console.");
      }
    }
  };

  // Handle toggle favorite for all books
  const handleToggleFavorite = async (book) => {
    try {
      const formData = new FormData();
      formData.append("title", book.title);
      formData.append("author", book.author);
      formData.append("genre", JSON.stringify(book.genre));
      formData.append("year", book.year);
      formData.append("description", book.description || "");
      formData.append("rating", book.rating || 0);
      formData.append("favorite", !book.favorite);
      if (book.source) formData.append("source", book.source);
      if (book.googleId) formData.append("googleId", book.googleId);

      const res = await fetch(`http://localhost:3001/api/books/${book._id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update favorite status");

      const savedBook = await res.json();

      setBooks((prev) =>
        prev.map((b) => (b._id === savedBook._id ? savedBook : b))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update favorite status. Check console.");
    }
  };

  // Handle update book after editing
  const handleUpdateBook = (updatedBook) => {
    setBooks((prev) =>
      prev.map((book) => (book._id === updatedBook._id ? updatedBook : book))
    );
    setShowEditForm(false);
    setEditingBook(null);
  };

  if (!Array.isArray(books) || books.length === 0) {
    return <p className="text-gray-500">No books added yet.</p>;
  }

  return (
    <>
      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {books.map((book) => (
          <div key={book._id} onClick={() => setSelectedBook(book)}>
            <BookCard
              book={book}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}

      {/* Edit Form Modal */}
      {showEditForm && editingBook && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setShowEditForm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Form
              onClose={() => {
                setShowEditForm(false);
                setEditingBook(null);
              }}
              onAddBook={handleUpdateBook}
              editingBook={editingBook}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BookGrid;
