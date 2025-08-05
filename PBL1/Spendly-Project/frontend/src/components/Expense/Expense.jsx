import { useState } from "react";
import styles from "./Expense.module.css";

const Expense = () => {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.expenseContainer}>
          <h2 className={styles.heading}>Add Transaction</h2>

          <form className={styles.expenseForm}>
            <label className={styles.label}>Amount:</label>
            <input
              className={styles.input}
              type="number"
              value=""
              name="amount"
              onChange=""
              required
            />

            <label className={styles.label}>Category: </label>

            <select name="category" value="" onChange="" required>
              <option value="">Select</option>
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
              <option value="Shopping">Shopping</option>
              <option value="Education">Education</option>
              <option value="Other">Other</option>
            </select>

            <label className={styles.label}>Date: </label>

            <input type="date" name="date" value="" onChange="" required />

            <label className={styles.label}>Description: </label>

            <textarea
              name="description"
              value=""
              onChange=""
              rows={4}
              placeholder="Enter details..."
              required
            />
            <button type="submit">Add Expense</button>
          </form>
        </div>

        <svg height="767" width="2">
          <line x1="1" y1="0" x2="1" y2="767" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>
    </>
  );
};

export default Expense;
