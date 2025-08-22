import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./Components/Navbar";
import Home from "./Components/Home";
import MyBooks from "./Components/MyBooks";
import Form from "./Components/Form";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Add or edit book
  const handleAddBook = (book) => {
    if (editingBook) {
      setBooks((prev) =>
        prev.map((b) => (b.id === editingBook.id ? { ...book, id: editingBook.id } : b))
      );
      setEditingBook(null);
    } else {
      setBooks((prev) => [...prev, { ...book, id: Date.now() }]);
    }
    setShowForm(false); // close form after submit
  };

  const handleEdit = (id) => {
    const bookToEdit = books.find((b) => b.id === id);
    setEditingBook(bookToEdit);
    setShowForm(true); // open form in edit mode
  };

  const handleDelete = (id) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"
      }`}
    >
      {/* Navbar triggers form */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onAddClick={() => {
          setEditingBook(null);
          setShowForm(true);
        }}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Routes */}
      <Routes>
        <Route
          path="/"
          element={
            <Home
              books={books.filter((book) => 
              book.title.toLowerCase().includes(searchTerm.toLowerCase())
            )}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          }
        />
        <Route path="/mybooks" element={<MyBooks />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <Form
            onAddBook={handleAddBook}
            onClose={() => {
              setShowForm(false);
              setEditingBook(null);
            }}
            initialData={editingBook}
            titleText={editingBook ? "Edit Book" : "Add Book"}
          />
        </div>
      )}
    </div>
  );
}

export default App;
