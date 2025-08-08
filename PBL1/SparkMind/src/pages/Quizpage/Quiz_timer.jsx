import React, { useState, useEffect } from "react";

const Quiz_timer = ({ setTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    // 🕒 This sets the timer countdown
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      console.log("Time's Up!");
      setTimeUp(true);
    }
  }, [timeLeft, setTimeUp]);

  return (
    <div className="timer">
      <strong>{timeLeft}</strong>
    </div>
  );
};

export default Quiz_timer;
