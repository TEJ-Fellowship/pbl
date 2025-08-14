const express = require('express');

const { 
    addIncome,
    getAllIncome,
    deleteIncome,
    downloadIncomeExcel
} = require('../controllers/incomeController.js');

const { protect } = require("../middlware/authMiddlware.js");

const router = express.Router();

router.post('/add', protect, addIncome);

//getAllIncome ko lage 
router.get('/get', protect, getAllIncome);
router.get('/downloadexcel', protect, downloadIncomeExcel);
router.delete('/:id', protect, deleteIncome);

module.exports = router;