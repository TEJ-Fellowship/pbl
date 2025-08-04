import { useState } from "react";
import './Expense.css'

const ExpenseForm = ({closePopup}) => {
  const [expenseList, setExpenseList] = useState([]);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = ['Food', 'Travel', 'Education', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Other'];



  const handleSubmit = (e)=>{
    e.preventDefault();

  const obj = {
      id: Date.now(),
      amount:amount,
      date:date,
      category:category,
      description:description
    }

    setExpenseList([obj, ...expenseList])

  if (closePopup) {
    closePopup();
  }

  // Optionally reset form
  setAmount(0);
  setDescription('');
  setCategory('Food');
  setDate(new Date().toISOString().split('T')[0]);    
  }


  return (
    <>
      <div className="form-container">
      <form onSubmit={handleSubmit}>

        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            name="amount"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input 
          type="date"
          id='date'
          onChange={(e) => setDate(e.target.value)}
          required
          />

        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            placeholder="Enter description"
            onChange={(e)=> setDescription(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label for="category">Category:</label>
          <select
            id="category"
            name="category"
            onChange={(e)=> setCategory(e.target.value)}
            required
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button type="submit">Add Expense</button>
      </form>
    </div>

      {/*expenseList.map((expense) => (
          <div class="expense-item">
          <div class="category">{expense.category}</div>
          <div class="amount">${expense.amount}</div>
          <div class="description">{expense.description}</div>
          <button className="">Delete</button>
        </div>
      ))*/}
    </>
  );
};

export default ExpenseForm;
