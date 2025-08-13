import { useEffect, useState } from "react";
import styles from "./RightContainer.module.css";

const RightContainer = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString();
  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const getSeasonInfo = () => {
    const month = currentTime.getMonth() + 1;

    if ([12, 1, 2].includes(month)) {
      return {
        season: "Winter",
        suggestion: "Try warm soup, spicy momos, or butter tea!"
      };
    } else if ([3, 4, 5].includes(month)) {
      return {
        season: "Spring",
        suggestion: "Fresh salads, fruit chaat, or light stir-fry!"
      };
    } else if ([6, 7, 8].includes(month)) {
      return {
        season: "Summer",
        suggestion: "Cool drinks, ice cream, and fruit bowls!"
      };
    } else {
      return {
        season: "Autumn",
        suggestion: "Hearty stews, roasted veggies, or curry rice!"
      };
    }
  };

  const { season, suggestion } = getSeasonInfo();

  return (
    <div className={styles.leftcontainer}>
      <p className={styles.datetime}>🕒 {formattedTime}</p>
      <p className={styles.datetime}>📅 {formattedDate}</p>
      <p className={styles.season}>🍂 Season: <strong>{season}</strong></p>
      <p className={styles.suggestion}>🍽️ Suggested: {suggestion}</p>
    </div>
  );
};

export default RightContainer;
