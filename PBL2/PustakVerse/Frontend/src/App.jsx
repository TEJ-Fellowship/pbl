import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./Components/Navbar";
import Home from "./Components/Home";
import MyBooks from "./Components/MyBooks";
import Form from "./Components/Form";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // ⬅ Lifted state here
  useEffect(() => {
    fetch("http://localhost:3001/books")
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error(err));
  }, []);
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
      {/* Pass down state and setter */}
      {/* Navbar triggers form */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        books={books}
        setBooks={setBooks}
        onAddClick={() => {
          setEditingBook(null);
          setShowForm(true);
        }}
      />

      {/* Routes */}
      <Routes>
        
        <Route
          path="/mybooks"
          element={<MyBooks books={books} setBooks={setBooks} />}
        />
        <Route
          path="/"
          element={
            <Home
              books={books}
              onDelete={handleDelete}
              onEdit={handleEdit}
              setBooks={setBooks}
            />
          }
        />
        
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
