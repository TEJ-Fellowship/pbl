const xlsx = require("xlsx"); // Import xlsx for Excel file handling

const Expense = require("../models/Expense")



//add expense source
exports.addExpense = async (req, res) => { 

    const userId = req.user._id;

    try {
        const { icon, category, amount, date } = req.body;

        // Validate required fields and check for missing fields
        if (!category || !amount || !date) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Create new income entry
        const newExpense = new Expense({
            user: userId,
            icon,
            category,
            amount,
            date:  new Date(date)
        });

        await newExpense.save(); // Save the new income entry to the database
        res.status(201).json({ message: "newExpense added successfully", newExpense });
    } catch (error) {
        console.error("Error adding income:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}


//get all expense source
exports.getAllExpense = async (req, res) => { 
    
    const userId = req.user._id;

    try {
        const expense = await Expense.find({ user: userId }).sort({ date: -1 }); // Fetch all expense entries for the user, sorted by date
        res.status(200).json(expense); // Return the income entries
    } catch (error) {
        console.error("Error fetching expense:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}


//delete income source
exports.deleteExpense = async (req, res) => {
    // const userId = req.user._id;

    try {
        await Expense.findByIdAndDelete(req.params.id); // Delete the income entry by ID
        res.status(200).json({ message: "Expense deleted successfully" }); // Return success
    } catch (error) {
        // console.error("Error deleting expense:", error);
        res.status(500).json({ message: "Server error", error: error.message }); // Return error
    }
 }

// download excel
exports.downloadExpenseExcel = async (req, res) => {
    const userId = req.user._id;

    try {
        const expense = await Expense.find({ user: userId }).sort({ date: -1 }); // Fetch all income entries for the user


        //good job these one
        if (expense.length === 0) {
            return res.status(404).json({ message: "No income data found" }); // Return error if no data found
        }


        //prepare the data for Excel download
        // Convert income data to Excel format
        const data = expense.map((item) => ({
            category: item.category,
            Amount: item.amount,
            // Date: item.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
            Date: item.date, // Format date as YYYY-MM-DD
            // Icon: item.icon
        }));

        const wb = xlsx.utils.book_new(); // Create a new workbook
        const ws = xlsx.utils.json_to_sheet(data); // Convert JSON data to a worksheet        
        xlsx.utils.book_append_sheet(wb, ws, "expense"); // Append the worksheet to the workbook
        xlsx.writeFile(wb, "expense_details.xlsx"); // Write the workbook to a file
        res.download('expense_details.xlsx'); // Send the file as a download
        // res.status(200).json({ message: "Excel file created successfully" }); //

    } catch (error) {
        console.error("Error downloading item Excel:", error);
        res.status(500).json({ message: "Server error", error: error.message }); // Return error
    }
 }