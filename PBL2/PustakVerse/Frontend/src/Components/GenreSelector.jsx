// Components/Form/GenreSelector.jsx
import React from "react";

const GenreSelector = ({ selectedGenres, setSelectedGenres }) => {
  const genres = [
    "Fiction",
    "Non-Fiction",
    "Science",
    "Fantasy",
    "Biography",
    "Mystery",
    "Self-Help",
  ];

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {genres.map((g) => (
        <label
          key={g}
          className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            value={g}
            checked={selectedGenres.includes(g)}
            onChange={() => toggleGenre(g)}
            className="accent-primary"
          />
          {g}
        </label>
      ))}
    </div>
  );
};

export default GenreSelector;
