import { useState } from "react"

import styles from "./Sidebar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDollarSign } from "@fortawesome/free-solid-svg-icons";
import { faBarsStaggered } from "@fortawesome/free-solid-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";



function Sidebar() {
    const [active, isActive] = useState(false);

    function toggleActive(){
        isActive(!active)
    }

  return (
    <>
      <div className={styles.sideBarContainer}>
        <div className={styles.circleContainer}>
          <FontAwesomeIcon icon={faDollarSign} className={styles.dollarIcon} />
        </div>

        <svg width={100} height={100} className={styles.line}>
          <line
            x1="0"
            y1="50"
            x2="100"
            y2="50"
            stroke="white"
            strokeWidth={2}
          />
        </svg>

        <div className={styles.itemContainer}>
          <FontAwesomeIcon
            icon={faBarsStaggered}
            className={styles.barsStaggered}
          />
          <FontAwesomeIcon icon={faDollarSign} className={styles.barsDollarIcon} />

         <FontAwesomeIcon icon={faPlus} className={`${styles.plus} ${active ? styles.multiply : ""}`} onClick={toggleActive}/>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
