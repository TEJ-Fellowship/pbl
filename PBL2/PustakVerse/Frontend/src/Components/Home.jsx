import React from "react";
import BookGrid from "./BookGrid";

const Home = ({ books }) => (
  <div className="max-w-7xl mx-auto p-6">
    <h1 className="text-2xl font-bold mb-6">Book Store</h1>
    <BookGrid books={books || []} /> {/* fallback to empty array */}
  </div>
);

export default Home;
