import React, { useState } from "react";
const Form = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState([]);
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [cover, setCover] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ title, author, genre, year, description, rating, favorite });
    onClose();
  };
  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="relative p-4 bg-white shadow-md rounded-lg space-y-2"
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
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => {
            setAuthor(e.target.value);
          }}
          className="border p-2 w-full"
        />
        <label className="block mb-1 font-semibold">Add Cover Image</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="bg-blue-300 text-white px-4 py-2 rounded"
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
        <div className="flex flex-wrap gap-2 mb-2">
          {[
            "Fiction",
            "Non-Fiction",
            "Science",
            "Fantasy",
            "Biography",
            "Mystery",
            "Self-Help",
          ].map((g) => (
            <label
              key={g}
              className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                value={g}
                checked={genre.includes(g)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setGenre([...genre, g]);
                  } else {
                    setGenre(genre.filter((x) => x !== g));
                  }
                }}
                className="accent-indigo-500"
              />
              {g}
            </label>
          ))}
        </div>

        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
          }}
          className="border p-2 w-full"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          className="border p-2 w-full"
        />
        <input
          type="text"
          min="0"
          max="5"
          placeholder="Rating (1-5)"
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
          }}
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
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Submit
        </button>
      </form>
    </>
  );
};

export default Form;
