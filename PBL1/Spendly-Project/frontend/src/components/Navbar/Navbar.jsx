import { useState } from "react";

import styles from "./Navbar.module.css";
function Navbar({ searchQuery, setSearchQuery }) {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <>
      <div className={styles.navBar}>
        <div className={styles.titleContainer}>
          <h1>Spendly</h1>
        </div>
        <div className={styles.searchContainer}>
          {searchOpen && (
            <input
              type="text"
              name="search"
              placeholder="Category..Date..Des..amt.."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          )}

          <svg
            className={styles.searchIcon}
            onClick={() => setSearchOpen(!searchOpen)}
            xmlns="http://www.w3.org/2000/svg"
            width="60"
            height="60"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>
    </>
  );
}

export default Navbar;
