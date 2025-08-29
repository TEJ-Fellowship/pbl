// Components/Form.jsx
import React, { useState, useEffect } from "react";
import GenreSelector from "./GenreSelector";
import { authFetch, handleApiError } from "../utils/api"; // Import the utility functions

const Form = ({ onClose, onAddBook, editingBook }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState([]);
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(null);
  const [favorite, setFavorite] = useState(false);
  const [cover, setCover] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    if (editingBook) {
      setTitle(editingBook.title || "");
      setAuthor(editingBook.author || "");
      setGenre(editingBook.genre || []);
      setYear(editingBook.year || "");
      setDescription(editingBook.description || "");
      setRating(
        editingBook.rating !== undefined && editingBook.rating !== null
          ? Number(editingBook.rating)
          : null
      );
      setFavorite(editingBook.favorite || false);

      if (editingBook.coverImage) {
        setImagePreview(
          `http://localhost:3001/uploads/${editingBook.coverImage}`
        );
      } else {
        setImagePreview("");
      }
    }
  }, [editingBook]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, GIF, WebP)");
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("Image size should be less than 5MB");
        return;
      }
      setCover(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setUploadStatus("");
    }
  };

  const removeImage = () => {
    setCover(null);
    setImagePreview("");
    const fileInput = document.getElementById("coverInput");
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadStatus("Uploading...");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("author", author);
      formData.append("genre", JSON.stringify(genre));
      formData.append("year", Number(year));
      formData.append("description", description);
      if (rating !== null) {
        formData.append("rating", Number(rating));
      }
      formData.append("favorite", favorite);
      formData.append("source", "manual"); // All form submissions are manual

      if (cover) {
        formData.append("coverImage", cover);
      }

      let url, method;
      if (editingBook) {
        const bookId = editingBook.id || editingBook._id;
        url = `http://localhost:3001/api/books/${bookId}`;
        method = "PUT";
      } else {
        url = "http://localhost:3001/api/books";
        method = "POST";
      }

      // Use the authFetch utility instead of regular fetch
      const res = await authFetch(url, {
        method,
        body: formData,
        // Note: Don't set Content-Type header for FormData - let the browser set it
      });

      // Handle API errors
      await handleApiError(res);

      const savedBook = await res.json();
      setUploadStatus("Success!");
      onAddBook(savedBook);
      onClose();
    } catch (err) {
      console.error("Form submission error:", err);
      setUploadStatus("Upload failed!");
      alert(err.message || "Something went wrong. Check console for details.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 
             shadow-xl rounded-2xl space-y-5 transition-colors max-h-[90vh] overflow-y-auto"
    >
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 
               dark:hover:text-gray-300 text-2xl font-bold z-10"
      >
        ×
      </button>

      {/* Heading */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        {editingBook ? "✏️ Edit Book" : "📚 Add a Book"}
      </h2>

      {/* Title & Author */}
      <input
        type="text"
        placeholder="Book Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border border-gray-300 dark:border-gray-700 p-3 w-full 
               rounded-lg focus:ring-2 focus:ring-primary focus:border-primary
               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        required
      />
      <input
        type="text"
        placeholder="Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="border border-gray-300 dark:border-gray-700 p-3 w-full 
               rounded-lg focus:ring-2 focus:ring-primary focus:border-primary
               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        required
      />

      {/* Cover Image */}
      <div className="space-y-3">
        <label className="block font-medium text-gray-700 dark:text-gray-300">
          Book Cover
        </label>
        {imagePreview && (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Book cover preview"
              className="w-32 h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white 
                     rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            className="bg-primary hover:bg-yellow-500 text-black font-medium 
                   px-4 py-2 rounded-lg transition-colors"
            onClick={() => document.getElementById("coverInput").click()}
          >
            {imagePreview ? "Change Cover" : "Upload Cover"}
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cover ? cover.name : "No file chosen"}
          </span>
        </div>
        <input
          type="file"
          accept="image/*"
          id="coverInput"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* Genre Selector */}
      <div>
        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
          Genres
        </label>
        <GenreSelector selectedGenres={genre} setSelectedGenres={setGenre} />
      </div>

      {/* Other Fields */}
      <input
        type="number"
        placeholder="Publication Year"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="border border-gray-300 dark:border-gray-700 p-3 w-full 
               rounded-lg focus:ring-2 focus:ring-primary focus:border-primary
               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />
      <textarea
        placeholder="Short Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border border-gray-300 dark:border-gray-700 p-3 w-full rounded-lg 
               h-28 resize-none focus:ring-2 focus:ring-primary focus:border-primary
               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />
      <input
        type="number"
        min="0"
        max="5"
        step="0.1"
        placeholder="Rating (0-5)"
        value={rating ?? ""}
        onChange={(e) =>
          setRating(e.target.value ? Number(e.target.value) : null)
        }
        className="border border-gray-300 dark:border-gray-700 p-3 w-full 
               rounded-lg focus:ring-2 focus:ring-primary focus:border-primary
               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />

      {/* Favorite Checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={favorite}
          onChange={() => setFavorite(!favorite)}
          className="w-4 h-4 accent-yellow-500 focus:ring-yellow-500 border-gray-300 rounded"
        />

        <span className="text-gray-700 dark:text-gray-300">
          Mark as Favorite
        </span>
      </label>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={uploadStatus === "Uploading..."}
        className="w-full bg-primary hover:bg-yellow-500 text-black font-semibold 
               px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
      >
        {uploadStatus === "Uploading..."
          ? "Uploading..."
          : editingBook
          ? "Update Book"
          : "Add Book"}
      </button>

      {/* Status */}
      {uploadStatus && uploadStatus !== "Uploading..." && (
        <p
          className={`text-sm text-center ${
            uploadStatus === "Success!" ? "text-green-600" : "text-red-600"
          }`}
        >
          {uploadStatus}
        </p>
      )}
    </form>
  );
};

export default Form;
