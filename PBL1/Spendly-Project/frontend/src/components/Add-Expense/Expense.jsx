import React,  { useState, useRef, useEffect } from 'react';
import './Expense.css'


const ExpensePopup = ({ onClose, onSubmit }) => {
  const popupRef = useRef(null);

  const [amount, setAmout] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');


  const categories = ['Food', 'Travel', 'Education', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Other'];
  //Close popup when clicking outside of it
  useEffect(() => {
    const handleClickedOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
        }
      };
      document.addEventListener('mousedown', handleClickedOutside);
      return () => document.removeEventListener('mousedown', handleClickedOutside); 
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ amount, date, description, category });
    onClose();
  };

  return (
    <div className='popup-overlay'>
      <div ref={popupRef} className='pop-content'>
        <h2 className='pop-title'>Add Expense</h2>
        <form onSubmit={handleSubmit} className='expense-form'>
          <input
            type="number" 
            placeholder='Amount' 
            value={amount}
            onChange={(e) => setAmout(e.target.value)}
            className='input-field'
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className='input-field'
            required
          />
          <input 
            type="text"
            placeholder='What did you on?'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className='input-field'
            required
          />
          <select 
            value={category}    
            onChange={(e) => setCategory(e.target.value)}
            className='input-field'      
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div class="button-group">
            <button
              type="button"
              onClick={onClose}
              class="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="submit-button"
            >
              Add
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

const ExpenseForm = () => {
  const [showPopup, setShowPopup] = useState(false);


  const handleAddExpense = (data) => {
    console.log('Expense Date', data);
    //Save to state or backend
  };

  return(
    <div class="app-container">
        <button
        onClick={() => setShowPopup(true)}
        class="add-expense-button"
      >
        Add Expense
      </button>

      {showPopup && (
        <ExpensePopup
          onClose={() => setShowPopup(false)}
          onSubmit={handleAddExpense}
        />
      )}
    </div>

  )
}

export default ExpenseForm