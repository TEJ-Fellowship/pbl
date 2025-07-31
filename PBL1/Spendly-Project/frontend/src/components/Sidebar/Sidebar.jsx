import { useState } from "react"

import styles from "./Sidebar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDollarSign } from "@fortawesome/free-solid-svg-icons";
import { faBarsStaggered } from "@fortawesome/free-solid-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";



function Sidebar() {
    const [active, isActive] = useState(false);
    const [barActive, isBarActive] = useState(false);

    function toggleActive(){
        isActive(!active)
    }

    function barToggleActive(){
        isBarActive(!barActive)
    }

  return (
    <>
      <div className={`${styles.sideBarContainer} ${barActive ? styles.activeSideBar : " "}`} onClick={barToggleActive}>
        <div className={styles.circleContainer} >
          <FontAwesomeIcon icon={faDollarSign} className={styles.dollarIcon} />
        </div>

        {barActive ? <svg width={160} height={100} className={styles.line}>
          <line
            x1="0"
            y1="50"
            x2="160"
            y2="50"
            stroke="white"
            strokeWidth={2}
          />
        </svg> : <svg width={90} height={100} className={styles.line}>
          <line
            x1="0"
            y1="50"
            x2="90"
            y2="50"
            stroke="white"
            strokeWidth={2}
          />
        </svg> }

        

        <div className={styles.itemContainer}>

          <FontAwesomeIcon
            icon={faBarsStaggered}
            className={styles.barsStaggered}
          />
          <FontAwesomeIcon icon={faDollarSign} className={styles.barsDollarIcon} />
          {barActive && <span className={styles.sideBarList}>Transaction List</span>}

         <FontAwesomeIcon icon={faPlus} className={`${styles.plus} ${active ? styles.multiply : ""}`} onClick={toggleActive}/>
         {barActive && <span className={styles.sideBarExpense}>Add Expenses</span>}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
