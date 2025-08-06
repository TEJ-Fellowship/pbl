const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { isValidObjectId, Types } = require("mongoose");

// Helper to calculate N days ago
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// Dashboard data
exports.getDashboardData = async (req, res) => {
    try {
        // Ensure user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = req.user.id;

        // Validate userId
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const userObjectId = new Types.ObjectId(userId);

        // Fetch total income
        const totalIncome = await Income.aggregate([
            { $match: { userId: userObjectId } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // Fetch total expense
        const totalExpense = await Expense.aggregate([
            { $match: { userId: userObjectId } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // Income transactions in the last 60 days
        const last60DaysIncomeTransactions = await Income.find({
            userId: userObjectId,
            date: { $gte: daysAgo(60) }
        }).sort({ date: -1 });

        const incomeLast60Days = last60DaysIncomeTransactions.reduce((acc, curr) => acc + curr.amount, 0);

        // Expense transactions in the last 30 days
        const last30DaysExpenseTransactions = await Expense.find({
            userId: userObjectId,
            date: { $gte: daysAgo(30) }
        }).sort({ date: -1 });

        const expenseLast30Days = last30DaysExpenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);

        // Fetch recent transactions (last 7, income + expense)
        const lastTransactions = [
            ...(await Income.find({ userId: userObjectId }).sort({ date: -1 }).limit(7)).map(
                (txn) => ({ ...txn.toObject(), type: "income" })
            ),
            ...(await Expense.find({ userId: userObjectId }).sort({ date: -1 }).limit(7)).map(
                (txn) => ({ ...txn.toObject(), type: "expense" })
            )
        ].sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by latest

        // Final response
        res.status(200).json({
            totalBalance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
            totalIncome: totalIncome[0]?.total || 0,
            totalExpense: totalExpense[0]?.total || 0,
            last30DaysExpense: {
                total: expenseLast30Days,
                transactions: last30DaysExpenseTransactions
            },
            last60DaysIncome: {
                total: incomeLast60Days,
                transactions: last60DaysIncomeTransactions
            },
            recentTransactions: lastTransactions
        });

    } catch (error) {
        console.error("Error fetching dashboard data:", error.message, error.stack);
        res.status(500).json({ message: "Internal server error" });
    }
};
