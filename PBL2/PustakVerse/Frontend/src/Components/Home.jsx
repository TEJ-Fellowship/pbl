// Components/Home/Home.jsx
import React from "react";
import BookGrid from "./BookGrid";

const Home = ({ books }) => {
  if (!books) return <p className="text-gray-500">Loading books...</p>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Book Store</h1>
      <BookGrid books={books} />
    </div>
  );
};

export default Home;
