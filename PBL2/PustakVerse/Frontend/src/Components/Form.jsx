// Components/Form/Form.jsx
import React, { useState, useEffect } from "react";
import GenreSelector from "./GenreSelector";

// MODIFIED: Added editingBook prop for edit functionality
const Form = ({ onClose, onAddBook, editingBook }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState([]);
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState("");
  const [favorite, setFavorite] = useState(false);
  // const [cover, setCover] = useState(null);

  // ADDED: useEffect to populate form when editing
  useEffect(() => {
    if (editingBook) {
      setTitle(editingBook.title || "");
      setAuthor(editingBook.author || "");
      setGenre(editingBook.genre || []);
      setYear(editingBook.year || "");
      setDescription(editingBook.description || "");
      setRating(editingBook.rating || "");
      setFavorite(editingBook.favorite || false);
    }
  }, [editingBook]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const bookData = {
      title,
      author,
      genre,
      year,
      description,
      rating,
      favorite,
      // cover: cover ? cover.name : null, // We'll just store the filename for now
    };

    try {
      // MODIFIED: Handle both add and edit operations
      let url, method;

      if (editingBook) {
        // For editing, use the book's ID (json-server uses 'id', not '_id')
        const bookId = editingBook.id || editingBook._id;
        url = `http://localhost:3001/books/${bookId}`;
        method = "PUT";
        console.log("Updating book with ID:", bookId); // Debug log
      } else {
        // For adding new book
        url = "http://localhost:3001/books";
        method = "POST";
        console.log("Adding new book"); // Debug log
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookData),
      });

      if (!res.ok) {
        console.error("API response status:", res.status);
        throw new Error(`Failed to ${editingBook ? "update" : "add"} book`);
      }

      const savedBook = await res.json();
      console.log("API response:", savedBook); // Debug log
      onAddBook(savedBook); // Add/Update the book in React state
      onClose();
    } catch (err) {
      console.error("Form submission error:", err);
      alert("Something went wrong. Check console for details.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md rounded-lg space-y-2 transition-colors"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        X
      </button>

      {/* MODIFIED: Dynamic title based on edit/add mode */}
      <h2>{editingBook ? "Edit Book" : "Add a Book"}</h2>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="text"
        placeholder="Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="border p-2 w-full"
      />

      {/* <label className="block mb-1 font-semibold">Add Cover Image</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
          onClick={() => document.getElementById("coverInput").click()}
        >
          Choose Cover
        </button>
        <span>{cover ? cover.name : "No file chosen"}</span>
      </div>
      <input
        type="file"
        accept="image/*"
        id="coverInput"
        onChange={(e) => setCover(e.target.files[0])}
        className="hidden"
      /> */}

      <label className="block mb-1 font-semibold">Select Genres</label>
      <GenreSelector selectedGenres={genre} setSelectedGenres={setGenre} />

      <input
        type="number"
        placeholder="Year"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="border p-2 w-full"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="text"
        min="0"
        max="5"
        placeholder="Rating (1-5)"
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        className="border p-2 w-full"
      />

      <label className="flex items-center">
        <input
          type="checkbox"
          checked={favorite}
          onChange={() => setFavorite(!favorite)}
          className="mr-2"
        />
        Favorite
      </label>

      <button
        type="submit"
        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
      >
        {/* MODIFIED: Dynamic button text */}
        {editingBook ? "Update" : "Submit"}
      </button>
    </form>
  );
};

export default Form;
