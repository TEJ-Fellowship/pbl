// pages/Movie.jsx
import { useLoaderData, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import Card from "../components/UI/Card";
import "../App.css"; // Assuming search-bar styles are here or move to Movie.css

const Movie = () => {
  const moviesData = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearchTerm = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // Store the debounced function in a ref.
  const debouncedSetSearchParamRef = useRef(
    debounce((value) => {
      if (value) {
        // Only update if the search parameter actually changes
        // This is a subtle but important optimization
        if (searchParams.get("search") !== value) {
          setSearchParams({ search: value });
        }
      } else {
        // Only update if the 'search' parameter exists and needs to be removed
        if (searchParams.has("search")) {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete("search");
          setSearchParams(newSearchParams);
        }
      }
    }, 3000)
  );

  // Effect to call the debounced function and handle cleanup
  useEffect(() => {
    // Capture the current value of the ref inside the effect's scope
    const currentDebounce = debouncedSetSearchParamRef.current;

    // Call the debounced function
    currentDebounce(searchTerm);

    // Cleanup function: cancel any pending debounced calls
    return () => {
      currentDebounce.cancel();
    };
  }, [searchTerm]); // <--- Key Change: Removed searchParams and setSearchParams

  // Log moviesData from the loader when it updates (optional)
  useEffect(() => {
    console.log("Movies data from loader:", moviesData);
  }, [moviesData]);

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="container">
      <div 
        className="search-bar"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '3rem',
          padding: '2rem 0',
        }}
        >
        <input
          type="text"
          placeholder="Search for movies..."
          value={searchTerm}
          onChange={handleInputChange}
          // className="search-input"
          style={{
            width: '300px',
            borderRadius: "25px",
            padding: "10px 20px",
            border: "1px solid #ccc",
            outline: 'none',
            fontSize: "1.6rem"
          }}
        />
      </div>
      {moviesData && moviesData.Search && moviesData.Search.length > 0 ? (
        <ul className="grid grid-four--cols">
          {moviesData.Search.map((curMovie) => (
            <Card key={curMovie.imdbID} curMovie={curMovie} />
          ))}
        </ul>
      ) : (
        <p className="no-movies-found">
          {moviesData.Error || "No movies found. Try a different search term!"}
        </p>
      )}
    </div>
  );
};

export default Movie;



// import { useLoaderData } from "react-router-dom";
// import  Card  from "../components/UI/Card";

// const Movie = () => {
//   const moviesData = useLoaderData();
//   console.log(moviesData);

//   return (
//     <ul className="container grid grid-four--cols">
//       {moviesData &&
//         moviesData.Search.map((curMovie) => {
//           // we have called the Card component and 
//           return <Card key={curMovie.imdbID} curMovie={curMovie} />;
//         })}
//     </ul>
//   );
// };


// export default Movie