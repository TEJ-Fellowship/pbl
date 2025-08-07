
import styles from "./LeftContainer.module.css";

const Leftcontainer = ({ username = "Zeref" }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good Morning';
    else if (hour < 18) return 'Good Afternoon';
    else return 'Good Evening';
  };

  return (
    <div className={styles.leftcontainer}>
      <h2 className={styles.greeting}>
        {getGreeting()}, <span className={styles.username}>{username}</span> 👋
      </h2>
    </div>
  );
};

export default Leftcontainer;
