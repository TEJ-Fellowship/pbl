// Components/Form.jsx
import React, { useState, useEffect } from "react";
import GenreSelector from "./GenreSelector";

const Form = ({ onClose, onAddBook, editingBook }) => {
  const [mode, setMode] = useState("manual"); // "manual" or "online"
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState([]);
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(null); // keep rating as number or null
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
      } else if (editingBook.coverUrl) {
        setImagePreview(editingBook.coverUrl);
      } else {
        setImagePreview("");
      }
    }
  }, [editingBook]);

  const fetchBookDetails = async () => {
    if (!title || !author) return alert("Enter title and author first");

    try {
      setUploadStatus("Fetching...");
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
          title
        )}+inauthor:${encodeURIComponent(author)}`
      );
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;

        let desc = book.description || "";
        if (desc.length > 300) desc = desc.slice(0, 300) + "...";

        setDescription(desc);
        setYear(book.publishedDate ? book.publishedDate.slice(0, 4) : "");
        setGenre(book.categories || []);
        setRating(book.averageRating ?? null);

        if (book.imageLinks?.thumbnail) {
          setImagePreview(book.imageLinks.thumbnail);
        }
        setUploadStatus("Fetched!");
      } else {
        setUploadStatus("Not found");
      }
    } catch (err) {
      console.error(err);
      setUploadStatus("Fetch failed");
    }
  };

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

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to ${editingBook ? "update" : "add"} book`
        );
      }

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
      className="relative p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md rounded-lg space-y-4 transition-colors max-h-[90vh] overflow-y-auto"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl font-bold z-10"
      >
        ×
      </button>

      <h2 className="text-xl font-bold mb-4">
        {editingBook ? "Edit Book" : "Add a Book"}
      </h2>

      {/* Toggle buttons */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`px-4 py-2 rounded ${
            mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setMode("manual")}
        >
          Manual
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded ${
            mode === "online" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setMode("online")}
        >
          Online
        </button>
      </div>

      {/* Title & Author */}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg"
        required
      />
      <input
        type="text"
        placeholder="Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg"
        required
      />

      {mode === "online" && (
        <button
          type="button"
          onClick={fetchBookDetails}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Fetch Details
        </button>
      )}

      {mode === "manual" || (mode === "online" && uploadStatus === "Fetched!") ? (
        <>
          {/* Cover Image */}
          <div className="space-y-3">
            <label className="block font-semibold">Book Cover Image</label>
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Book cover preview"
                  className="w-32 h-48 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => document.getElementById("coverInput").click()}
              >
                {imagePreview ? "Change Cover" : "Choose Cover"}
              </button>
              <span className="text-sm">
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

          <div>
            <label className="block mb-2 font-semibold">Select Genres</label>
            <GenreSelector selectedGenres={genre} setSelectedGenres={setGenre} />
          </div>

          <input
            type="number"
            placeholder="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border p-3 w-full rounded-lg"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-3 w-full rounded-lg h-24 resize-vertical"
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
            className="border p-3 w-full rounded-lg"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={favorite}
              onChange={() => setFavorite(!favorite)}
              className="w-4 h-4"
            />
            <span>Mark as Favorite</span>
          </label>
        </>
      ) : null}

      <button
        type="submit"
        disabled={uploadStatus === "Uploading..."}
        className="w-full bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg"
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
