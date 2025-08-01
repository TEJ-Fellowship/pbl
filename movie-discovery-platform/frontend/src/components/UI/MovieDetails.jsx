/* eslint-disable no-unused-vars */
// /* eslint-disable react/prop-types */
import { NavLink, useLoaderData } from "react-router-dom";
import "../UI/Card.css";
import { useEffect, useState } from "react";
import StarRating from "./StarRating";

const MovieDetails = () => {
  const movieData = useLoaderData();
  //data yesmw aaauxa
  // console.log(movieData);

  const [isAddedToWatchlist, setIsAddedToWatchlist] = useState(false);
  const [rating, setRating] = useState(0);
  useEffect(() => {
    const storedWatchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
    const movieInWatchlist = storedWatchlist.some(
      (movie) => movie.imdbID === movieData.imdbID
    );
    setIsAddedToWatchlist(movieInWatchlist);
  }, [movieData.imdbID]); // Re-run effect if movieData.imdbID changes

  const handleAddToWatchlist = () => {
    // Get existing watchlist from local storage
    const storedWatchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

    // Check if the movie is already in the watchlist
    const movieExists = storedWatchlist.some(
      (movie) => movie.imdbID === movieData.imdbID
    );

    if (!movieExists) {
      //when adding a movie to the watchlist , include the raing:
      const movieWithRating ={ ...movieData, userRating: rating};
      // Add the current movie data to the watchlist
      const updatedWatchlist = [...storedWatchlist, movieWithRating];
      localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
      setIsAddedToWatchlist(true);
      alert(`${movieData.Title} added to your watchlist!`);
    } else {
      alert(`${movieData.Title} is already in your watchlist!`);
    }
  };

  const {
    Actor,
    Poster,
    Title,
    Runtime,
    Genre,
    Type,
    Year,
    Plot,
    BoxOffice,
    imdbID,
    Awards,
    imdbRating,
  } = movieData;

  // 192min
  const totalMinutes = Runtime.replace("min", "");
  const hours = Math.floor(totalMinutes / 60); // Calculate the number of hours
  const minutes = totalMinutes % 60; // Calculate the remaining minutes

  console.log(hours, minutes);

  const formattedTime = `${hours}hr ${minutes}min`;
  // console.log(formattedTime);

  return (
    <li className="hero-container hero-movie-container">
      <div className="main-container">
        <figure className="movie">
          <div className="movie__hero">
            <img src={Poster} alt="Rambo" className="movie__img" />
          </div>
          <div className="movie__content">
            <div className="movie__title">
              <h1 className="heading__primary">
                {Title} <i className="fas fa-fire"></i>
              </h1>
              <div className="movie__tag movie__tag--1">{`#${Type}`}</div>
              <div className="movie__tag movie__tag--2">Year: {Year}</div>
            </div>
            <p className="movie__description">{Plot}</p>
            <br />
            <p className="movie__description">Awards: {Awards}</p>
            <div className="movie__details">
              <p className="movie__detail">
                <span className="icons icons-red">
                  <i className="fas fa-camera-retro"></i>
                </span>
                Rating: {imdbRating}
              </p>
              <p className="movie__detail">
                <span className="icons icons-grey">
                  <i className="fas fa-clock"></i>
                </span>
                {formattedTime}
              </p>
              <p className="movie__detail">
                <span className="icons icons-yellow">
                  <i className="fas fa-file-invoice-dollar"></i>
                </span>
                {BoxOffice}
              </p>
              {/* here we go and pass setRating to StarRating */}
              <StarRating 
                onSetRating={setRating}
                message={["Terrible", "Bad", "Okary","Good","Excellent"]}
                />
            </div>

            <div>
              <button
                onClick={handleAddToWatchlist}
                // className="movie__tag movie__tag--2"
                style={{
                  textAlign: "center",
                  fontSize: "1.6rem",
                  backgroundColor: "pink",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  border: "none",
                  cursor: isAddedToWatchlist ? "not-allowed" : "pointer",
                  color: "white",
                }}
                disabled={isAddedToWatchlist} // Disable if already added
              >
                {isAddedToWatchlist ? "Added to Watchlist" : "Add to Watchlist"}
              </button>
              <NavLink
                to="/movie"
                className="movie__tag movie__tag--2"
                style={{ textAlign: "center", fontSize: "1.6rem" }}
              >
                Go Back
              </NavLink>
            </div>
          </div>
          <div className="movie__price">{BoxOffice}</div>
        </figure>
      </div>
    </li>
  );
};

export default MovieDetails;
