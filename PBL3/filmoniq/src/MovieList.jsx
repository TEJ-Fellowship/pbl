import React, { useEffect, useState } from "react";
import MovieModal from "./MovieModal";
const STORAGE_KEY = "myMovies";

const MovieList = ({ movies, genres, loading }) => {
  const [savedIds, setSavedIds] = useState([]);

  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setSavedIds(stored.map((movie) => movie.id));
  }, []);

  // 🔹 Save movie to My List
  function saveToMyList(movie) {
    let current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(current)) current = [];
    if (current.some((m) => m.id === movie.id)) return;

    const minimal = {
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, minimal]));
    setSavedIds([...savedIds, movie.id]);
  }

  if (loading) {
    // Show 8 skeleton cards
    return (
      <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-[#1E1E1E] p-4 shadow-md animate-pulse flex flex-col"
          >
            <div className="bg-gray-700 h-48 w-full mb-3 rounded-lg"></div>{" "}
            {/* poster */}
            <div className="h-6 bg-gray-600 rounded mb-2 w-3/4"></div>{" "}
            {/* title */}
            <div className="h-4 bg-gray-600 rounded mb-1 w-1/2"></div>{" "}
            {/* rating */}
            <div className="h-3 bg-gray-600 rounded mb-1 w-full"></div>{" "}
            {/* overview line 1 */}
            <div className="h-3 bg-gray-600 rounded mb-1 w-full"></div>{" "}
            {/* overview line 2 */}
            <div className="h-3 bg-gray-600 rounded mb-1 w-5/6"></div>{" "}
            {/* overview line 3 */}
            <div className="mt-auto h-8 bg-gray-700 rounded w-full"></div>{" "}
            {/* button */}
          </div>
        ))}
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return genres.length > 0 ? <p>No movies found for these genres.</p> : null;
  }

  return (
    <>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {movies.map((movie) => (
          <div
            key={movie.id}
            onClick={() => setSelectedMovie(movie)}
            className="rounded-lg bg-[#1E1E1E] border border-[#333333] p-4 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer flex flex-col"
          >
            <h3 className="mb-3 text-lg font-semibold text-white">
              {movie.title}
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-[#E50000] text-white text-xs font-medium px-2 py-1 rounded-full"
                >
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </span>
              ))}
            </div>

            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                alt={movie.title}
                className="mb-3 rounded-lg shadow-lg w-full h-[350px] object-cover"
              />
            ) : (
              <p className="mb-3 italic text-gray-400">No image available</p>
            )}

            <p className="mb-2 font-medium text-white">
              Rating: {movie.vote_average.toFixed(1)} ⭐
            </p>

            <p className="mb-4 italic text-white line-clamp-5">
              {movie.overview}
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation(); //
                saveToMyList(movie);
              }}
              className={`w-full rounded-lg px-4 py-2 text-white transition-all duration-200 ${
                savedIds.includes(movie.id)
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-[#E50000] hover:bg-[#FF1A1A]"
              }`}
              disabled={savedIds.includes(movie.id)}
            >
              {savedIds.includes(movie.id) ? " ✅ Added" : "Add to my list"}
            </button>
          </div>
        ))}
      </div>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onAction={() => saveToMyList(selectedMovie)}
          actionText={
            savedIds.includes(selectedMovie.id) ? "✅ Added" : "Add to my list"
          }
          actionClass={
            savedIds.includes(selectedMovie.id)
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-[#E50000] hover:bg-[#FF1A1A]"
          }
        />
      )}
    </>
  );
};

export default MovieList;
