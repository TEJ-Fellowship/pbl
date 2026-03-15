import React, { useEffect, useState } from "react";
import GenreSelector from "./GenreSelector";
import MovieList from "./MovieList";

const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;

const Home = () => {
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${tmdbApiKey}`
        );
        const data = await res.json();
        setTrending(data.results);
      } catch (err) {
        console.error("Failed to fetch trending movies:", err);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <GenreSelector />

      {trending.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-white mb-4">Trending Now</h2>
          <MovieList movies={trending} genres={[]} loading={false} />
        </div>
      )}
    </div>
  );
};

export default Home;
