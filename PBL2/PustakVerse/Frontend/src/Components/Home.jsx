import React from "react";
import BookGrid from "./BookGrid";
import GoogleBooks from "./GoogleBooks";

function Home({ books, setBooks }) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <h2 className="text-xl font-semibold">Add books from internet</h2>

      {/* Google Books Search Component */}
      <GoogleBooks books={books} setBooks={setBooks} />

      {/* Existing Saved Books */}
      <h3 className="text-lg font-semibold mt-6">My Books</h3>

      <BookGrid books={books} setBooks={setBooks} />
    </div>
  );
}

export default Home;
