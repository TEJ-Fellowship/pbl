import { useState, useEffect } from "react";
import GenreSelector from "./GenreSelector";

const Form = ({ onClose, onAddBook, initialData = null, titleText = "Add Book" }) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [author, setAuthor] = useState(initialData?.author || "");
  const [genre, setGenre] = useState(initialData?.genre || []);
  const [year, setYear] = useState(initialData?.year || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [rating, setRating] = useState(initialData?.rating || "");
  const [favorite, setFavorite] = useState(initialData?.favorite || false);
  const [cover, setCover] = useState(initialData?.cover || null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setAuthor(initialData.author);
      setGenre(initialData.genre);
      setYear(initialData.year);
      setDescription(initialData.description);
      setRating(initialData.rating);
      setFavorite(initialData.favorite);
      setCover(initialData.cover);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    onAddBook({
      title,
      author,
      genre,
      year,
      description,
      rating,
      favorite,
      cover,
    });
  }
      

    try {
      const res = await fetch("http://localhost:3001/books", {
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
    <div className="max-w-md w-full mx-4 p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          X
        </button>
        <h2 className="text-xl font-semibold">{titleText}</h2>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="border p-2 w-full rounded"
        />

        <label className="block mb-1 font-semibold">Add Cover Image</label>
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
        />

        <label className="block mb-1 font-semibold">Select Genres</label>
        <GenreSelector selectedGenres={genre} setSelectedGenres={setGenre} />

        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <input
          type="text"
          min="0"
          max="5"
          placeholder="Rating (1-5)"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="border p-2 w-full rounded"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={favorite}
            onChange={() => setFavorite(!favorite)}
          />
          Favorite
        </label>

        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors w-full"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default Form;
