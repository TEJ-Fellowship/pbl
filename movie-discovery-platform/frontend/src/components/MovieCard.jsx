// src/components/MovieCard.jsx
import { Link } from 'react-router-dom';
import './MovieCard.css' // for styling the movies 
const MovieCard = ({ movie }) => {
  return (
    <div className="movie-card">
      <div className="movie-poster"> 
        <img
          src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Image"}
          alt={movie.Title}
        />
      </div>
      <div className='movie-info'>
          <h3 className='movie-title'>{movie.Title}</h3>
          <p className='movie-year'>{movie.Year}</p>
          {/* here button to navigate to MovieDetails with state */}
          <Link to={ `/movie/${movie.imdbID}`} >
            <button className='details-btn'>View Details</button>
          </Link>
      </div>
    </div>
  );
};

export default MovieCard;
