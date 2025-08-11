const User = require("../models/User");
const Income = require("../models/Income");
const xlsx = require("xlsx");

//Add income source
exports.addIncome = async (req, res) => {
    const userId = req.user.id;

    try {
        const { icon, source, amount, date } = req.body;

        if(!source || !amount || !date){
            return res.status(400).json({ message: "All fields are required" });
        }

        const newIncome =  new Income({
            userId,
            icon,
            source,
            amount,
            date: new Date(date)
        })

        await newIncome.save();

        res.status(201).json({ message: "Income source added successfully", income: newIncome });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

//Get all income sources
exports.getAllIncome = async (req, res) => {
    const userId = req.user.id;

    try {
        const income = await Income.find({ userId }).sort({ date: -1 });
        res.status(200).json({ income });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

//Delete income source
exports.deleteIncome = async (req, res) => {
    const userId = req.user.id;

    try {
        const income = await Income.findOneAndDelete({ _id: id, userId });

        if(!income){
            return res.status(404).json({ message: "Income source not found" });
        }
        res.status(200).json({ message: "Income source deleted successfully", income });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

//Download income excel
exports.downloadIncomeExcel = async (req, res) => {
    const userId = req.user.id;

    try {
        const income = await Income.find({ userId }).sort({ date: -1 });

        //prepare data for excel
        const data = income.map(item => ({
            Date: item.date.toLocaleDateString(),
            Source: item.source,
            Amount: item.amount
        }));

        //create excel file
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Income");
          // Write workbook to buffer in memory
    const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set headers for file download
    res.setHeader("Content-Disposition", "attachment; filename=income_details.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    // Send buffer as response
    res.send(buf);

    
        // xlsx.write(wb, 'income_details.xlsx');
        // res.download('income_details.xlsx');

        //set headers for download
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}