// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { fetchMovies } from '../api/movieService';
import MovieCard from '../components/MovieCard';
import BannerHome from './BannerHome'; // You mentioned to include it

import './Home.css'; // Import the CSS

const Home = () => {
  const [query, setQuery] = useState('Inception'); // Default search query
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const getMovies = async () => {
      const result = await fetchMovies(query);
      if (result && result.Search) {
        setMovies(result.Search);
      } else {
        setMovies([]);
      }
    };

    const handler = setTimeout(() => {
      getMovies();
    }, 500);

    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="home-page">
      <BannerHome />

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search movies..."
        className="search-input-main"
      />

      {movies.length > 0 ? (
        <div className="movie-grid">
          {movies.map((movie) => (
            //here we have called MovieCard component
            //and passed movie as a prop
            <MovieCard key={movie.imdbID} movie={movie} />
          ))}
        </div>
      ) : (
        <p className="no-movies-message">No movies found for "{query}".</p>
      )}
    </div>
  );
};

export default Home;
