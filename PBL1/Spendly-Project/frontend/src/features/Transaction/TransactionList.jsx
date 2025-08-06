import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import styles from "./TransactionList.module.css";
import Calender from "./Calender";
import filterByDateRange from "../Filter/filter";

function TransactionList({ expenses, onDelete, searchQuery }) {

  const [calender, setCalender] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemPerPage = 7;

  const navigate = useNavigate();

  // Reset to first page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

//   const filteredExpense = filterByDateRange(expenses, startDate, endDate);
//   const indexOfLastItem = currentPage * itemPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemPerPage;
//   const currentExpense = filteredExpense.slice(indexOfFirstItem, indexOfLastItem);

//   const toggleCalendar = () => setCalender(prev => !prev);
  const dateFiltered = filterByDateRange(expenses, startDate, endDate);
  const filteredExpense = dateFiltered.filter((expense) =>
    (
      String(expense.description) +
      String(expense.category) +
      String(expense.amount) +
      String(expense.date)
    )
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemPerPage;
  const indexOfFirstItem = indexOfLastItem - itemPerPage;
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
    <div className={styles.container}>
      <div className={styles.row}>
        {/* Filter Controls */}
        <div className={styles.filterContainer}>
          <select className={styles.categoryOption} name="transaction-category" id="category">
            <option value="category">Category</option>
            <option value="Food">Food</option>
            <option value="Health">Health</option>
            <option value="Personal Care">Personal Care</option>
            <option value="Gym">Gym</option>
            <option value="Miscellaneous">Miscellaneous</option>
            <option value="Study">Study</option>
            <option value="Home Appliance">Home Appliance</option>
            <option value="Petrol">Petrol</option>
            <option value="Grocery">Grocery</option>
          </select>

          <button className={styles.calenderBtn} onClick={isCalender}>
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

          <select className={styles.expenseType} name="type" id="expense-type">
            <option value="Type">Type</option>
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>
        </div>

        {/* Pagination */}
        <div className={styles.paginationContainer}>
          <input
            className={styles.prevBtn}
            type="button"
            value="<"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          />
          <span>{currentPage}</span>
          <input
            className={styles.nextBtn}
            type="button"
            value=">"
            onClick={() =>
              setCurrentPage(prev =>
                prev < Math.ceil(filteredExpense.length / itemPerPage) ? prev + 1 : prev
              )
            }
            disabled={currentPage === Math.ceil(filteredExpense.length / itemPerPage)}
          />
        </div>
      </div>

      {/* Expense List */}
      <div className={styles.ListContainer}>
        {currentExpense.length > 0 ? (
          <ul className={styles.expenselist}>
            {currentExpense.map((expense) => (
              <li key={expense.id} className={styles.expenseItem}>
                <div className={styles.expenseDetail}>
                  <div className={styles.right}>
                    <h3 className={styles.expenseCategory}>{expense.category}</h3>
                    <p className={styles.expenseDescription}>{expense.description}</p>
                  </div>
                  <div className={styles.mid}>
                    $<strong className={styles.expenseAmount}>{expense.amount}</strong>
                    <p className={styles.expenseDate}>{expense.date}</p>
                  </div>
                  <div className={styles.expenseAction}>
                    <button
                      className={styles.editButton}
                      onClick={() => navigate(`/edit/${expense.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => onDelete(expense.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.noExpense}>
            <h3 style={{ textAlign: "center", margin: "1rem" }}>No Expenses Yet!</h3>
            <p>Start tracking your expenses by adding your first one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionList;
