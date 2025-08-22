import React from "react"
import BookCard from "./BookCard"

const BookSection = ({ title, books, onDelete, onEdit}) => {
    if (!books || books.length === 0) return null;

    return (
        <div className="my-6">
            <h2 className="text-2xl font-semibold mb-4">{title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {
                    books.map((book) =>(
                        <BookCard
                        key={book.id}
                        book={book}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        />
                ))
                }

            </div>
        </div>
    );
};

export default BookSection;