import { X, BookOpen, Download, Star, Heart } from "lucide-react";

// A modal component that displays selected book details and closes when clicking outside or on the close button.
const BookModal = ({ book, onClose }) => {
  // If no book is passed, don't render anything
  if (!book) return null;
  const rating = book.rating ?? 4.6;
  const reviews =
    typeof book.reviews === "number"
      ? book.reviews.toLocaleString()
      : (book.reviews ?? "2,891");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-[92%] max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          {/* Cover */}
          <img
            src={book.coverImage}
            alt={book.title}
            className="h-72 w-full rounded-xl object-cover md:h-80"
          />

          {/* Details */}
          <div>
            <h2 className="font-serif text-2xl font-bold text-gray-900">
              {book.title}
            </h2>
            <p className="mt-1 text-gray-600">by {book.author}</p>

            <span className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
              {book.category}
            </span>

            {/* Rating + Favorites */}
            <div className="mt-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < Math.floor(rating)
                        ? "fill-orange-500 text-orange-500"
                        : "text-gray-300"
                    }
                  />
                ))}
                <span className="ml-2 text-2xl font-semibold text-gray-900">
                  {rating}
                </span>
                <span className="text-sm text-gray-500">
                  ({reviews} reviews)
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-gray-700">
              {book.description ||
                "No description available yet. Add one in your data to show more details here."}
            </p>
{/* TODO: Will add onClick handlers for read full book and borrow book buttons */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <BookOpen size={16} />
                Read Full Book
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
              >
                <Download size={16} />
                Borrow Book
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookModal;
