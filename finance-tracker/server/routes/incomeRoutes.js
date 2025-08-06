const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { addIncome, getAllIncome, deleteIncome, downloadIncomeExcel } = require("../controllers/incomeController");

const app = express.Router();

app.post('/add', protect, addIncome);
app.get('/get', protect, getAllIncome);
app.get('/downloadexcel', protect, downloadIncomeExcel);
app.delete('/:id', protect, deleteIncome);

module.exports = app;