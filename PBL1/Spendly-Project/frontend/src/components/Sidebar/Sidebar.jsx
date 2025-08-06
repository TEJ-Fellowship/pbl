import { useState } from "react";
import styles from "./Sidebar.module.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDollarSign,
  faBars,
  faPlus,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import ExpenseForm from "../Expense/Expense"; // import the form component

function Sidebar() {
  // const [active, isActive] = useState(false);
  const [barActive, isBarActive] = useState(false);
  const navigate = useNavigate();

  function barToggleActive() {
    isBarActive(!barActive);
  }

  // function handlePlusClick() {
  //   isActive(!active);
  // }

  // function closePopup() {
  //   setShowExpenseForm(false); // hide popup
  // }

  function handleTransactionList() {
    navigate("/transaction");
  }

  function handleAddExpense() {
    navigate("/add-expense");
  }

  return (
    <>
      <div
        className={`${styles.sideBarContainer} ${
          barActive ? styles.activeSideBar : ""
        }`}
      >
        <div className={styles.toggleContainer}>
          <button
            className={styles.toggleButton}
            onClick={barToggleActive}
            // style={{ backgroundColor: barActive ? "#002218" : "#00160D" }}
            
          >{barActive ? "<" : ">"}</button>
        </div>

        <div className={styles.circleContainer}>
          <FontAwesomeIcon icon={faDollarSign} className={styles.dollarIcon} />
        </div>

        {barActive ? (
          <svg width={170} height={100} className={styles.line}>
            <line
              x1="0"
              y1="50"
              x2="170"
              y2="50"
              stroke="white"
              strokeWidth={2}
            />
          </svg>
        ) : (
          <svg width={60} height={100} className={styles.line}>
            <line
              x1="0"
              y1="50"
              x2="60"
              y2="50"
              stroke="white"
              strokeWidth={2}
            />
          </svg>
        )}

        <div className={styles.itemContainer}>
          <div
            className={styles.transactionList}
            onClick={handleTransactionList}
          >
            <FontAwesomeIcon icon={faBars} className={styles.bars} />
            {barActive && (
              <span className={styles.sideBarList}>Transaction List</span>
            )}
          </div>

          <div className={styles.addExpense} onClick={handleAddExpense}>
            <FontAwesomeIcon icon={faPlus} className={styles.plus} />
            {barActive && (
              <span className={styles.sideBarExpense}>Add Expenses</span>
            )}
          </div>

          <FontAwesomeIcon icon={faGear} className={styles.gear} />

          {barActive && <span className={styles.sideBarSetting}>Setting</span>}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
