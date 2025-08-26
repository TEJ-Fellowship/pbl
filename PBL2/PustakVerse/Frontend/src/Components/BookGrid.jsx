// Components/BookGrid.jsx
import React, { useState } from "react";
import BookCard from "./BookCard";
import BookModal from "./BookModal";
// ADDED: Import the Form component for editing
import Form from "./Form";

// MODIFIED: Added setBooks prop for updating the books state
const BookGrid = ({ books, setBooks }) => {
  if (!Array.isArray(books) || books.length === 0)
    return <p className="text-gray-500">No books added yet.</p>;
  const [selectedBook, setSelectedBook] = useState(null); // state for modal
  // ADDED: States for edit functionality
  const [editingBook, setEditingBook] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // ADDED: Handle edit book
  const handleEdit = (book) => {
    setEditingBook(book);
    setShowEditForm(true);
  };

  // ADDED: Handle delete book
  const handleDelete = async (book) => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      try {
        const res = await fetch(`http://localhost:3001/api/books/${book._id}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Failed to delete book");

        // Update the books state by removing the deleted book
        setBooks((prev) => prev.filter((b) => b._id !== book._id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete book. Check console.");
      }
    }
  };

  // ADDED: Handle update book after editing
  const handleUpdateBook = (updatedBook) => {
    setBooks((prev) =>
      prev.map((book) => (book._id === updatedBook._id ? updatedBook : book))
    );
    setShowEditForm(false);
    setEditingBook(null);
  };

  if (books.length === 0)
    return <p className="text-gray-500">No books added yet.</p>;

  return (
    <>
      {/* Book Grid */}
      <div className="absolute left-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
        {books.map((book, index) => (
          <div key={index} onClick={() => setSelectedBook(book)}>
            {/* MODIFIED: Added onEdit and onDelete props */}
            <BookCard book={book} onEdit={handleEdit} onDelete={handleDelete} />
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}

      {/* ADDED: Edit Form Modal */}
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
              editingBook={editingBook} // Pass the book to edit
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BookGrid;
