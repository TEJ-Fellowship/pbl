// Components/Form.jsx
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
  // ADDED: Image-related states
  const [cover, setCover] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

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
      // UPDATED: Set existing cover image for editing
      if (editingBook.coverImage) {
        setImagePreview(
          `http://localhost:3001/uploads/${editingBook.coverImage}`
        );
      } else {
        setImagePreview("");
      }
    }
  }, [editingBook]);

  // ADDED: Handle file selection and create preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ADDED: Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
        return;
      }

      // ADDED: Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert("Image size should be less than 5MB");
        return;
      }

      setCover(file);
      // ADDED: Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setUploadStatus("");
    }
  };

  // ADDED: Remove selected image
  const removeImage = () => {
    setCover(null);
    setImagePreview("");
    // Clear the file input value
    const fileInput = document.getElementById("coverInput");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadStatus("Uploading...");

    try {
      // MODIFIED: Use FormData instead of JSON for file upload
      const formData = new FormData();
      formData.append("title", title);
      formData.append("author", author);
      formData.append("genre", JSON.stringify(genre)); // Convert array to JSON string
      formData.append("year", Number(year));
      formData.append("description", description);
      formData.append("rating", Number(rating));
      formData.append("favorite", favorite);

      // ADDED: Append image file if selected
      if (cover) {
        formData.append("coverImage", cover);
      }

      // MODIFIED: Handle both add and edit operations
      let url, method;

      if (editingBook) {
        // For editing, use the book's ID
        const bookId = editingBook.id || editingBook._id;
        url = `http://localhost:3001/api/books/${bookId}`;
        method = "PUT";
        console.log("Updating book with ID:", bookId);
      } else {
        // For adding new book
        url = "http://localhost:3001/api/books";
        method = "POST";
        console.log("Adding new book");
      }

      const res = await fetch(url, {
        method: method,
        // IMPORTANT: Don't set Content-Type header for FormData
        // Browser will set it automatically with the correct boundary
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("API response status:", res.status);
        throw new Error(
          errorData.error || `Failed to ${editingBook ? "update" : "add"} book`
        );
      }

      const savedBook = await res.json();
      console.log("API response:", savedBook);
      setUploadStatus("Success!");
      onAddBook(savedBook); // Add/Update the book in React state
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
      className="relative p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md rounded-lg space-y-4 transition-colors max-h-[90vh] overflow-y-auto"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl font-bold z-10"
      >
        ×
      </button>

      {/* MODIFIED: Dynamic title based on edit/add mode */}
      <h2 className="text-xl font-bold mb-4">
        {editingBook ? "Edit Book" : "Add a Book"}
      </h2>

      {/* ADDED: Cover Image Upload Section */}
      <div className="space-y-3">
        <label className="block font-semibold text-gray-700 dark:text-gray-300">
          Book Cover Image
        </label>

        {/* ADDED: Image Preview */}
        {imagePreview && (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Book cover preview"
              className="w-32 h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-md"
              onError={(e) => {
                console.error("Failed to load image preview:", imagePreview);
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div className="hidden w-32 h-48 bg-gray-200 dark:bg-gray-700 items-center justify-center rounded-lg border-2 border-gray-300 dark:border-gray-600">
              <span className="text-gray-500 text-sm">Failed to load</span>
            </div>
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-md"
              title="Remove image"
            >
              ×
            </button>
          </div>
        )}

        {/* ADDED: File Input Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            onClick={() => document.getElementById("coverInput").click()}
          >
            {imagePreview ? "Change Cover" : "Choose Cover"}
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cover ? cover.name : "No file chosen"}
          </span>

          {/* ADDED: Upload status indicator */}
          {uploadStatus && (
            <span
              className={`text-sm font-medium ${
                uploadStatus.includes("Success")
                  ? "text-green-600"
                  : uploadStatus.includes("failed")
                  ? "text-red-600"
                  : "text-blue-600"
              }`}
            >
              {uploadStatus}
            </span>
          )}
        </div>

        {/* ADDED: Hidden file input */}
        <input
          type="file"
          accept="image/*"
          id="coverInput"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* ADDED: Help text */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Supported formats: JPEG, PNG, GIF, WebP (Maximum 5MB)
        </p>
      </div>

      {/* Existing form fields */}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary"
        required
      />

      <input
        type="text"
        placeholder="Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary"
        required
      />

      <div>
        <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
          Select Genres
        </label>
        <GenreSelector selectedGenres={genre} setSelectedGenres={setGenre} />
      </div>

      <input
        type="number"
        placeholder="Year"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary"
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-24 resize-vertical focus:ring-2 focus:ring-primary focus:border-primary"
      />

      <input
        type="number"
        min="0"
        max="5"
        step="0.1"
        placeholder="Rating (0-5)"
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary"
      />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={favorite}
          onChange={() => setFavorite(!favorite)}
          className="w-4 h-4 accent-primary"
        />
        <span className="font-medium">Mark as Favorite</span>
      </label>

      <button
        type="submit"
        disabled={uploadStatus === "Uploading..."}
        className="w-full bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploadStatus === "Uploading..."
          ? "Uploading..."
          : editingBook
          ? "Update Book"
          : "Add Book"}
      </button>
    </form>
  );
};

export default Form;
