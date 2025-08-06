const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { addExpense, getAllExpense, deleteExpense, downloadExpenseExcel } = require("../controllers/expenseController");

const app = express.Router();

app.post('/add', protect, addExpense);
app.get('/get', protect, getAllExpense);
app.get('/downloadexcel', protect, downloadExpenseExcel);
app.delete('/:id', protect, deleteExpense);

module.exports = app;