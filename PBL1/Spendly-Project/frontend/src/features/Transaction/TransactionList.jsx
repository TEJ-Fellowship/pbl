import { useState, useEffect } from "react";

import styles from "./TransactionList.module.css";
import Calender from "./Calender";
import Expense from "../../components/Data/Expense";
import filterByDateRange from "../Filter/filter";

function TransactionList() {
  const [calender, setCalender] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemPerPage = 7;

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  //paginate data
  const indexOfLastItem = currentPage * itemPerPage;
  const indexOfFirstItem = indexOfLastItem - itemPerPage;

  const filteredExpense = filterByDateRange(Expense, startDate, endDate);
  const currentExpense = filteredExpense.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  console.log("Current page:", currentPage);
  console.log("Current items:", currentExpense);

  function isCalender() {
    setCalender(!calender);
    return calender;
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.row}>
          <div className={styles.filterContainer}>
            <select
              className={styles.categoryOption}
              name="transaction-category"
              id="category"
            >
              <option value="category" selected>
                Category
              </option>
              <option value="Food">Food</option>
              <option value="Health">Health</option>
              <option value="Personal Care">Personal Care</option>
              <option value="Gym">Gym</option>
              <option value="Miscelleneous">Miscelleneous</option>
              <option value="Study">Study</option>
              <option value="Home Appliance">Home Appliance</option>
              <option value="Petrol">Petrol</option>
              <option value="Grocery">Grocery</option>
            </select>

            <button
              className={styles.calenderBtn}
              onClick={() => isCalender(!calender)}
            >
              Date
            </button>
            {calender && (
              <Calender
                onRangeChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
              />
            )}

            <select
              className={styles.expenseType}
              name="type"
              id="expense-type"
            >
              <option value="Type" Selected>
                Type
              </option>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>

          <div className={styles.paginationContainer}>
            <input
              className={styles.prevBtn}
              type="button"
              value={"<"}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            />
            <span>{currentPage}</span>
            <input
              className={styles.nextBtn}
              type="button"
              value={">"}
              onClick={() =>
                setCurrentPage((prev) =>
                  prev < Math.ceil(filteredExpense.length / itemPerPage)
                    ? prev + 1
                    : prev
                )
              }
              disabled={
                currentPage === Math.ceil(filteredExpense.length / itemPerPage)
              }
            />
          </div>
        </div>

        <div className={styles.ListContainer}>
          <ul className={styles.expenselist}>
            {currentExpense.map((expense, index) => {
              return (
                <li key={index} className={styles.expenseItem}>
                  <div class={styles.expenseDetail}>
                    <div className={styles.right}>
                      <h3 className={styles.expenseCategory}>
                        {expense.category}
                      </h3>
                      <p className={styles.expenseDescription}>
                        {expense.description}
                      </p>
                    </div>
                    <div className={styles.mid}>
                      $
                      <strong className={styles.expenseAmount}>
                        {expense.amount}
                      </strong>
                      <p className={styles.expenseDate}>{expense.date}</p>
                    </div>

                    <div className={styles.expenseAction}>
                      <button className={styles.editButton}>Edit</button>
                      <button className={styles.deleteButton}>Delete</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}

export default TransactionList;
