

const Income = require('../models/Income');
const Expense = require('../models/Expense');
const { isValidObjectId, Types } = require('mongoose');


//dashboard data controller
exports.getDashboardData = async (req, res) => { 
    try {
        const userId = req.user._id;

        const userObjectId =  new Types.ObjectId(String(userId));

        // Validate userId khoi tw xaina tesle gareko 


        //fetch total income and expenses
        const totalIncome = await Income.aggregate([
            { $match: { user: userObjectId } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

      console.log("Total Income:", {totalIncome, userId: isValidObjectId(userId)});

      //now fetch total expenses
      const totalExpense = await Expense.aggregate([
            { $match: { user: userObjectId } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      //get income transactions in the last 60 days
      const last60DaysIncomeTransactions = await Income.find({
        user: userId,
        date: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
      }).sort({ date: -1 });

      //get total income for last 60 days
      const incomeLast60Days = last60DaysIncomeTransactions.reduce(
        (sum, transaction) => sum + transaction.amount, 0
      );

      //get expense transactions in the last 30 days
      const last30DaysExpenseTransactions = await Expense.find({
        user: userId,
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).sort({ date: -1 });

      //get total expenses for last 30 days
      const expenseLast30Days = last30DaysExpenseTransactions.reduce(
        (sum, transaction) => sum + transaction.amount, 0
      );

      //fetch last 5 transactions (income + expnese)
      const lastTransactions = [ 
        ...(await Income.find({ user: userId }).sort({ date: -1 }).limit(5)).map(
            transaction => ({
                        ...transaction.toObject(),
                        type: 'income',
                })
            ),
         ...(await Expense.find({ user: userId }).sort({ date: -1 }).limit(5)).map(
            transaction => ({
             ...transaction.toObject(),
             type: 'expense',
         })
        )
    ].sort((a, b) => b.date - a.date);

    //final response
    res.json({
        totalBalance:
        (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
        totalIncome: totalIncome[0]?.total || 0,
        totalExpense: totalExpense[0]?.total || 0,
        last30DaysExpenses :{ 
            total: expenseLast30Days,
            transactions: last30DaysExpenseTransactions,
        },
        last60DaysIncome: {
            total: incomeLast60Days,
            transactions: last60DaysIncomeTransactions,
        },
        recentTransactions: lastTransactions,
    });

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "Server error" });
    }
}