import React from "react";
import { LuArrowRight } from "react-icons/lu";
import moment from "moment";
import TransactionInfoCard from "../Cards/TransactionInfoCard";

const RecentTransactions = ({ expenses, incomes, onSeeMore }) => {
  // Add type flag for each transaction
  const expenseItems = expenses.map((item) => ({ ...item, type: "expense" }));
  const incomeItems = incomes.map((item) => ({ ...item, type: "income" }));

  // Combine and sort by date descending
  const combined = [...expenseItems, ...incomeItems].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  if (combined.length === 0) {
    return (
      <div className="card">
        <p>No recent transactions found.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between ">
        <h5 className="text-lg">Recent Transactions</h5>

        <button className="card-btn" onClick={onSeeMore}>
          See All <LuArrowRight className="text-base" />
        </button>
      </div>

      <div className="mt-6">
        {combined.slice(0, 5).map((item) => (
          <TransactionInfoCard
            key={item._id}
            title={item.type === "expense" ? item.category : item.source}
            icon={item.icon}
            date={moment(item.date).format("Do MMM YYYY")}
            amount={item.amount}
            type={item.type}
            hideDeleteBtn
          />
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
