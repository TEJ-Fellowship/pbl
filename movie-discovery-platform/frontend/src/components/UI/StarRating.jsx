import { useState } from "react";

const containerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const starContainerStyle = {
  display: "flex",
};

const StarRating = ({
  maxRating = 5,
  color = "#fcc419",
  size = 24,
  message = [],
  onSetRating,
}) => {
  const textStyle = {
    lineHeight: "1",
    margin: "0",
    color,
    fontSize: `${size / 1.5}px`,
  };
  const [star, setStart] = useState(0);
  const [tempRating, setTempRating] = useState(0);

  const handleRating = (rating) => {
    // setStart(star);
    setStart(rating);
    //ai
    onSetRating?.(rating); // <-- pass rating to parent
  };
  return (
    <div style={containerStyle}>
      <div style={starContainerStyle}>
        {Array.from({ length: maxRating }, (_, i) => (
          //   <span key={i}>S(i+1)</span>
          <Star
            key={i}
            // onClick={() => setStart(i + 1)}
            // onClick={() => handleRating(i + 1)}
            onRate={() => handleRating(i + 1)}
            full={tempRating ? tempRating >= i + 1 : star >= i + 1}
            color={color}
            size={size}
            onRateIn={() => setTempRating(i + 1)}
            onRateOut={() => setTempRating(0)}
          />
        ))}
      </div>
      {/* <p style={textStyle}>
        {message.length === maxRating
          ? message[tempRating ? tempRating - 1 : star - 1]
          : tempRating || star || ""}
      </p> */}
      <p style={textStyle}>
        {message.length === maxRating
          ? message[tempRating ? tempRating - 1 : star - 1]
          : tempRating || star
          ? `You rated this ${tempRating || star} star(s)`
          : "Give your rating"}
      </p>
    </div>
  );
};

const Star = ({ onRate, full, color, size, onRateIn, onRateOut }) => {
  const starStyle = {
    height: `${size}px`,
    width: `${size}px`,
    display: "block",
    cursor: "pointer",
    color,
  };
  return (
    <span
      style={starStyle}
      onClick={onRate}
      // onMouseEnter={() => console.log("first")}
      // onMouseLeave={() => console.log("leave")}
      onMouseEnter={onRateIn}
      onMouseLeave={onRateOut}
    >
      {full ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill={color}
          stroke={color}
          //   width="24"
          //   height="24"
        >
          <path
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1
        1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37
        2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755
        1.688-1.538 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37
        2.448c-.783.57-1.838-.197-1.538-1.118l1.287-3.96a1
        1 0 00-.364-1.118L2.075 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1
        1 0 00.95-.69l1.286-3.96z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke={color}
          //   width="24"
          //   height="24"
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
  );
};

export default StarRating;
