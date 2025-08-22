import React from "react";
import BookGrid from "./BookGrid";

const Home = ({ books, onDelete, onEdit  }) => (
  <div className="max-w-1xl mx-auto ">
    <h1 className="text-2xl font-bold mt-6 ml-6">Book Store</h1>

    

     <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">All Books</h2>
      <BookGrid books={books} onDelete={onDelete} onEdit={onEdit} />
    </div>
  </div>
);

export default Home;
