
import styles from './Navbar.module.css';
import { FaSearch } from "react-icons/fa";
import { MdOutlineBookmarkAdd } from "react-icons/md";
import { RxAvatar } from "react-icons/rx";

const Navbar = () => {
  return (
    <nav className={styles.navBar}>
      <span className={styles.brand}>
        Culinary Campanion
      </span>

      <div className={styles.links}>
        <span className={styles.link}>Home</span>
        <span className={styles.link}>Explore</span>
      </div>

      <div className={styles.rightSection}>
        <span className={styles.search}>
          <FaSearch className={styles.icon} />
          <input placeholder='Search' />
        </span>

        <span className={styles.bookmark}>
          <MdOutlineBookmarkAdd size={30} className={styles.icon} />
        </span>

        <span className={styles.avatar}>
          <RxAvatar className={styles.avatarIcon} />
        </span>
      </div>
    </nav>
  );
};

export default Navbar;
