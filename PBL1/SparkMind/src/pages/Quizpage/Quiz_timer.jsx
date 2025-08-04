import React from "react";
import { useState, useEffect } from "react";

const Quiz_timer = ({ setTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          console.log("Time's Up!");
          setTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="timer">
      <strong>{timeLeft}</strong>
    </div>
  );
};

export default Quiz_timer;
