import styles from "./Navbar.module.css";
import { FaSearch } from "react-icons/fa";
import { MdOutlineBookmarkAdd } from "react-icons/md";
import { RxAvatar } from "react-icons/rx";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const isExplorePage = location.pathname === "/explore";

  return (
    <nav className={styles.navBar}>
      <span className={styles.brand}>Culinary Campanion</span>

      <div className={styles.links}>
        <Link to="/" className={styles.link}>
          Home
        </Link>
        <Link to="/add-recipe" className={styles.link}>
          Add Recipe
        </Link>
        <Link to="/explore" className={styles.link}>
          Explore
        </Link>
      </div>

      <div className={styles.rightSection}>
        {isExplorePage && (
          <span className={styles.navSearch}>
            <FaSearch className={styles.icon} />
            <input className={styles.navSearchInput} placeholder="Search" />
          </span>
        )}

        <span className={styles.bookmark}>
          <Link to="/favorite"><MdOutlineBookmarkAdd size="1.5rem" className={styles.icon} /></Link>
        </span>

        <span className={styles.avatar}>
          <RxAvatar className={styles.avatarIcon} />
        </span>
      </div>
    </nav>
  );
};

export default Navbar;
