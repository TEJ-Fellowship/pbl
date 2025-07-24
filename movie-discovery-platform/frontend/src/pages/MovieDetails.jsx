// src/pages/MovieDetails.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./MovieDetails.css"; // optional for styling

const MovieDetails = () => {
  const { id } = useParams(); // IMDb ID from URL
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const res = await fetch(`https://www.omdbapi.com/?apikey=66cadd0a&i=${id}&plot=full`);
        const data = await res.json();
        setMovie(data);
      } catch (err) {
        console.error("Failed to fetch movie details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  if (loading) return <p style={{ color: "white" }}>Loading...</p>;
  if (!movie || movie.Response === "False") return <p style={{ color: "white" }}>Movie not found.</p>;

  return (
    <div className="movie-details-container" style={{ display: "flex", padding: "20px", color: "white" }}>
      <div className="movie-poster" style={{ flex: "0 0 auto", marginRight: "20px" }}>
        <img
          src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Image"}
          alt={movie.Title}
          style={{ width: "300px", borderRadius: "10px" }}
        />
      </div>
      <div className="movie-info">
        <h1>{movie.Title}</h1>
        <p><strong>Year:</strong> {movie.Year}</p>
        <p><strong>Runtime:</strong> {movie.Runtime !== "N/A" ? movie.Runtime : "Not available"}</p>
        <p><strong>Rated:</strong> {movie.Rated !== "N/A" ? movie.Rated : "Not rated"}</p>
        <p><strong>Box Office:</strong> {movie.BoxOffice !== "N/A" ? movie.BoxOffice : "Not available"}</p>
        <p><strong>Awards:</strong> {movie.Awards !== "N/A" ? movie.Awards : "None"}</p>
        <p><strong>Director:</strong> {movie.Director !== "N/A" ? movie.Director : "Not listed"}</p>
        <p><strong>Writer:</strong> {movie.Writer !== "N/A" ? movie.Writer : "Not listed"}</p>
        <p><strong>Actors:</strong> {movie.Actors !== "N/A" ? movie.Actors : "Not listed"}</p>
        <p><strong>Plot:</strong> {movie.Plot !== "N/A" ? movie.Plot : "No plot available"}</p>
        {movie?.Website && movie.Website !== "N/A" && (
          <p>
            <strong>Website:</strong>{" "}
            <a href={movie.Website} target="_blank" rel="noreferrer" style={{ color: "#4fc3f7" }}>
              {movie.Website}
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default MovieDetails;
