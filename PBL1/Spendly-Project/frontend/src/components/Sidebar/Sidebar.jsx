import { useState } from "react";
import styles from "./Sidebar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDollarSign, faBarsStaggered, faPlus } from "@fortawesome/free-solid-svg-icons";
import ExpenseForm from "../Add-Expense/Expense"; // import the form component
import './Popup.css'; // we'll create this CSS

function Sidebar() {
  const [active, isActive] = useState(false);
  const [barActive, isBarActive] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false); // popup state

  function barToggleActive() {
    isBarActive(!barActive);
  }

  function handlePlusClick() {
    isActive(!active);
    setShowExpenseForm(true); // show popup
  }

  function closePopup() {
    setShowExpenseForm(false); // hide popup
  }

  return (
    <>
      <div className={`${styles.sideBarContainer} ${barActive ? styles.activeSideBar : ""}`} onClick={barToggleActive}>
        <div className={styles.circleContainer}>
          <FontAwesomeIcon icon={faDollarSign} className={styles.dollarIcon} />
        </div>

        {barActive ? (
          <svg width={160} height={100} className={styles.line}>
            <line x1="0" y1="50" x2="160" y2="50" stroke="white" strokeWidth={2} />
          </svg>
        ) : (
          <svg width={90} height={100} className={styles.line}>
            <line x1="0" y1="50" x2="90" y2="50" stroke="white" strokeWidth={2} />
          </svg>
        )}

        <div className={styles.itemContainer}>
          <FontAwesomeIcon icon={faBarsStaggered} className={styles.barsStaggered} />
          <FontAwesomeIcon icon={faDollarSign} className={styles.barsDollarIcon} />
          {barActive && <span className={styles.sideBarList}>Transaction List</span>}

          <FontAwesomeIcon
            icon={faPlus}
            className={`${styles.plus} ${active ? styles.multiply : ""}`}
            onClick={handlePlusClick}
          />
          {barActive && <span className={styles.sideBarExpense}>Add Expenses</span>}
        </div>
      </div>

      {/* Popup Modal */}
      {showExpenseForm && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            {/* <button className="close-btn" onClick={closePopup}></button> */}
            <ExpenseForm closePopup={closePopup} />
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
