const User = require("../models/User");
const Expense = require("../models/Expense");
const xlsx = require("xlsx");

//Add expense
exports.addExpense = async (req, res) => {
    const userId = req.user.id;

    try {
        const { icon, category, amount, date } = req.body;

        if (!category || !amount || !date) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newExpense = new Expense({
            userId,
            icon,
            category,
            amount,
            date: new Date(date)
        })

        await newExpense.save();

        res.status(201).json({ message: "Expense added successfully", expense: newExpense });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

//Get all expenses
exports.getAllExpense = async (req, res) => {
    const userId = req.user.id;

    try {
        const expense = await Expense.find({ userId }).sort({ date: -1 });
        res.status(200).json({ expense });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

//Delete expense
exports.deleteExpense = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const expense = await Expense.findOneAndDelete({ _id: id, userId });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        res.status(200).json({ message: "Expense deleted successfully", expense });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

//Download expense excel
exports.downloadExpenseExcel = async (req, res) => {
    const userId = req.user.id;

    try {
        const expense = await Expense.find({ userId }).sort({ date: -1 });

        //prepare data for excel
        const data = expense.map(item => ({
            Date: item.date.toLocaleDateString(),
            Category: item.category,
            Amount: item.amount
        }));

        //create excel file
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Expense");
        // write workbook to buffer
        const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

        // set headers for file download
        res.setHeader("Content-Disposition", "attachment; filename=expense_details.xlsx");
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        // send buffer as response
        res.send(buf);

        //set headers for download
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}