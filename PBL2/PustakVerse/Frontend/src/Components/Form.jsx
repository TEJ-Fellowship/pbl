import React, { useState } from "react";
import GenreSelector from "./GenreSelector";

const Form = ({ onClose, onAddBook }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState([]);
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState("");
  const [favorite, setFavorite] = useState(false);
  // const [cover, setCover] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newBook = {
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
      const res = await fetch("http://localhost:3001/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBook),
      });

      if (!res.ok) throw new Error("Failed to add book");

      const savedBook = await res.json();
      onAddBook(savedBook); // Add the book to your React state
      onClose();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check console.");
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

      <h2>Add a book</h2>
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
        Submit
      </button>
    </form>
  );
};

export default Form;
