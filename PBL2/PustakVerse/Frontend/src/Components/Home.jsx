// Components/Home.jsx
import React from "react";
import BookGrid from "./BookGrid";

// MODIFIED: Added setBooks prop to pass down to BookGrid
const Home = ({ books, setBooks }) => {
  if (!books) return <p className="text-gray-500">Loading books...</p>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Book Store</h1>
      {/* MODIFIED: Pass setBooks prop to BookGrid */}
      <BookGrid books={books} setBooks={setBooks} />
    </div>
  );
};

export default Home;
