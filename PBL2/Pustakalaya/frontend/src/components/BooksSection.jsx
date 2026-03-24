import BookGrid from "./BookGrid";

const BooksSection = ({
  books,
  isLoading,
  error,
  onRetry,
  onBookClick,
  emptyMessage = "No books found.",
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Array.from().map(): Creates 8 placeholder <div> elements using .map() to show a loading skeleton while data is being fetched.*/}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[22rem] animate-pulse rounded-2xl bg-gray-200"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{error}</p>
        <button type="button" onClick={onRetry} className="mt-2 font-medium underline">
          Retry
        </button>
      </div>
    );
  }

  if (!books.length) {
    return <div>{emptyMessage}</div>;
  }

  return <BookGrid books={books} onBookClick={onBookClick} />;
};

export default BooksSection;
