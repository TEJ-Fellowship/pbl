const xlsx = require("xlsx"); // Import xlsx for Excel file handling

const Income = require("../models/Income")



//add income source
exports.addIncome = async (req, res) => { 
    const userId = req.user._id;

    try {
        const { icon, source, amount, date } = req.body;

        // Validate required fields and check for missing fields
        if (!source || !amount || !date) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Create new income entry
        const newIncome = new Income({
            user: userId,
            icon,
            source,
            amount,
            date:  new Date(date)
        });

        await newIncome.save(); // Save the new income entry to the database
        res.status(201).json({ message: "Income added successfully", income: newIncome });
    } catch (error) {
        console.error("Error adding income:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}


//get all income source
exports.getAllIncome = async (req, res) => { 
    const userId = req.user._id;

    try {
        const income = await Income.find({ user: userId }).sort({ date: -1 }); // Fetch all income entries for the user, sorted by date
        res.status(200).json(income); // Return the income entries
    } catch (error) {
        console.error("Error fetching incomes:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}


//add income source
exports.deleteIncome = async (req, res) => {
    // const userId = req.user._id;

    try {
        await Income.findByIdAndDelete(req.params.id); // Delete the income entry by ID
        res.status(200).json({ message: "Income deleted successfully" }); // Return success
    } catch (error) {
        // console.error("Error deleting income:", error);
        res.status(500).json({ message: "Server error", error: error.message }); // Return error
    }
 }

// download excel
exports.downloadIncomeExcel = async (req, res) => {
    const userId = req.user._id;

    try {
        const incomes = await Income.find({ user: userId }).sort({ date: -1 }); // Fetch all income entries for the user


        //good job these one
        if (incomes.length === 0) {
            return res.status(404).json({ message: "No income data found" }); // Return error if no data found
        }


        //prepare the data for Excel download
        // Convert income data to Excel format
        const data = incomes.map((item) => ({
            Source: item.source,
            Amount: item.amount,
            // Date: item.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
            Date: item.date, // Format date as YYYY-MM-DD
            // Icon: item.icon
        }));

        const wb = xlsx.utils.book_new(); // Create a new workbook
        const ws = xlsx.utils.json_to_sheet(data); // Convert JSON data to a worksheet        
        xlsx.utils.book_append_sheet(wb, ws, "Incomes"); // Append the worksheet to the workbook
        xlsx.writeFile(wb, "incomes_details.xlsx"); // Write the workbook to a file
        res.download('incomes_details.xlsx'); // Send the file as a download
        // res.status(200).json({ message: "Excel file created successfully" }); //

    } catch (error) {
        console.error("Error downloading item Excel:", error);
        res.status(500).json({ message: "Server error", error: error.message }); // Return error
    }
 }