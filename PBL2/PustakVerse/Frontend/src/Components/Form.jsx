import React, { useState } from "react";
const Form = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
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

        <select>
          type="text" value={genre}
          onChange=
          {(e) => {
            setGenre(e.target.value);
          }}
          className="border p-2 w-full"
          <option value="">Select a genre</option>
          <option value="Fiction">Fiction</option>
          <option value="Non-Fiction">Non-Fiction</option>
          <option value="Science">Science</option>
          <option value="Fantasy">Fantasy</option>
          <option value="Biography">Biography</option>
          <option value="Mystery">Mystery</option>
          <option value="Self-Help">Self-Help</option>
        </select>
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
