// components/ReadOnlyStarRating.jsx
const ReadOnlyStarRating = ({ rating = 0, maxRating = 5, color = "#fcc419", size = 24 }) => {
  const starStyle = {
    height: `${size}px`,
    width: `${size}px`,
    display: "block",
    color,
  };

  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {Array.from({ length: maxRating }, (_, i) => (
        <span key={i} style={starStyle}>
          {i < rating ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill={color}
              stroke={color}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1
                1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37
                2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755
                1.688-1.538 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37
                2.448c-.783.57-1.838-.197-1.538-1.118l1.287-3.96a1
                1 0 00-.364-1.118L2.075 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1
                1 0 00.95-.69l1.286-3.96z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke={color}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.157 6.636h6.978c.969 0 1.371 1.24.588 1.81l-5.645 4.1 2.158 6.636c.3.921-.755 1.688-1.538 1.118L12 18.347l-5.645 4.1c-.783.57-1.838-.197-1.538-1.118l2.158-6.636-5.645-4.1c-.783-.57-.38-1.81.588-1.81h6.978l2.157-6.636z"
              />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
};

export default ReadOnlyStarRating;
