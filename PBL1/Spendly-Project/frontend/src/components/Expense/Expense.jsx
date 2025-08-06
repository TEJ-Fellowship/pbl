import { useEffect, useState } from "react";
import styles from "./Expense.module.css";
import { useParams, useNavigate } from 'react-router-dom';

const Expense = ({ onAddExpense, onUpdate, expenses = [] }) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');

  const { id } = useParams();
  const navigate = useNavigate();

  const categories = [
    'Food', 'Transport', 'Education', 'Entertainment',
    'Healthcare', 'Shopping', 'Utilities', 'Other'
  ];

  const editing = Boolean(id);
  const existing = editing ? expenses.find(e => e.id.toString() === id) : null;


  useEffect(() => {
    if (editing && existing) {
      setAmount(existing.amount);
      setDescription(existing.description);
      setCategory(existing.category);
      setDate(existing.date);
    }
  }, [editing, existing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !description) return;

    const expense = {
      id: existing?.id ?? Date.now(),
      amount: parseFloat(amount),
      description,
      category,
      date
    };

    if (editing && onUpdate) {
      onUpdate(expense);
      navigate('/transaction');
    } else if (onAddExpense) {
      onAddExpense(expense);
      navigate('/transaction');
    }

    // Reset form after submission
    setAmount('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.expenseContainer}>
        <h2 className={styles.heading}>{editing ? 'Edit' : 'Add'} Expense</h2>

        <form className={styles.expenseForm} onSubmit={handleSubmit}>
          <label className={styles.label}>Amount:</label>
          <input
            className={styles.input}
            type="number"
            value={amount}
            name="amount"
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <label className={styles.label}>Category: </label>
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <label className={styles.label}>Date: </label>
          <input
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <label className={styles.label}>Description: </label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Enter details..."
            required
          />

          <button type="submit">
            {editing ? 'Update' : 'Add'} Expense
          </button>
        </form>
      </div>

      <svg height="767" width="2">
        <line x1="1" y1="0" x2="1" y2="767" stroke="#fff" strokeWidth="2" />
      </svg>
    </div>
  );
};

export default Expense;
