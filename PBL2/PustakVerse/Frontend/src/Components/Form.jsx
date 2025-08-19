import React, { useState } from "react";
const Form = () => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ title, author, genre, year, description, rating, favorite });
  };
  return (
    <>
      <div>This is form</div>
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white shadow-md rounded-lg space-y-2"
      >
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
        <input
          type="text"
          placeholder="Genre"
          value={genre}
          onChange={(e) => {
            setGenre(e.target.value);
          }}
          className="border p-2 w-full"
        />
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
          type="text"
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
