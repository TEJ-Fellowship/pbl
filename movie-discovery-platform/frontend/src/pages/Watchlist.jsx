// pages/Watchlist.jsx
import { useEffect, useState } from "react";
// import Card from "../components/UI/Card"; // Assuming you want to reuse your Card component
import "./Watchlist.css"; // Create this CSS file for styling

const Watchlist = () => {
  const [watchlistMovies, setWatchlistMovies] = useState([]);

  useEffect(() => {

    //concept of localstorage here 
    const storedWatchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
    setWatchlistMovies(storedWatchlist);
  }, []);

  const handleRemoveFromWatchlist = (imdbID) => {
    const updatedWatchlist = watchlistMovies.filter(
      (movie) => movie.imdbID !== imdbID
    );
    //concept of localstorage
    localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
    setWatchlistMovies(updatedWatchlist);
  };

  return (
    <div className="watchlist-container container">
      <h2 className="watchlist-title">My Watchlist</h2>
      {watchlistMovies.length === 0 ? (
        <p className="no-movies-message">
          No movies in your watchlist yet. Add some from the movie details page!
        </p>
      ) : (
        <div className="watchlist-list"> {/* New container for list items */}
          {watchlistMovies.map((curMovie) => (
            <div key={curMovie.imdbID} className="watchlist-item-detail"> {/* Changed class name */}
              <div className="watchlist-item-image">
                <img src={curMovie.Poster} alt={curMovie.Title} />
              </div>
              <div className="watchlist-item-info">
                <h3>{curMovie.Title} ({curMovie.Year})</h3>
                <p><strong>Genre:</strong> {curMovie.Genre}</p>
                <p><strong>Runtime:</strong> {curMovie.Runtime}</p>
                <p><strong>IMDB Rating:</strong> {curMovie.imdbRating}</p>
                <p><strong>Actors:</strong> {curMovie.Actors}</p>
                <p className="watchlist-plot">{curMovie.Plot}</p>
                <button
                  className="remove-button"
                  onClick={() => handleRemoveFromWatchlist(curMovie.imdbID)}
                >
                  Remove from Watchlist
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;