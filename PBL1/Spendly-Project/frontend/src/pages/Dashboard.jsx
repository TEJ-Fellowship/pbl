import { useState } from "react";

import styles from "./Dashboard.module.css";
import ExpenseStatistics from "./ExpenseStatistics";
import PiChart from "./PiChart";

function Dashboard({ barActive }) {
  const [selectedPeriod, setSelectedPeriod] = useState("Daily");

  const expenseData = {
    Daily: {
      chartData: [
        { name: "Mon", amount: 120 },
        { name: "Tue", amount: 200 },
        { name: "Wed", amount: 150 },
        { name: "Thu", amount: 300 },
        { name: "Fri", amount: 250 },
        { name: "Sat", amount: 400 },
        { name: "Sun", amount: 180 },
      ],
      categories: [
        { name: "Food", value: 800, color: "#22C55E" },
        { name: "Transport", value: 300, color: "#8B5CF6" },
        { name: "Shopping", value: 500, color: "#F59E0B" },
        { name: "Food", value: 800, color: "#22C55E" },
        { name: "Transport", value: 300, color: "#8B5CF6" },
        { name: "Shopping", value: 500, color: "#F59E0B" },
        { name: "Food", value: 800, color: "#22C55E" },
        { name: "Transport", value: 300, color: "#8B5CF6" },
        { name: "Shopping", value: 500, color: "#F59E0B" },
        { name: "Food", value: 800, color: "#22C55E" },
        { name: "Transport", value: 300, color: "#8B5CF6" },
        { name: "Shopping", value: 500, color: "#F59E0B" },
        { name: "Food", value: 800, color: "#22C55E" },
        { name: "Transport", value: 300, color: "#8B5CF6" },
        { name: "Shopping", value: 500, color: "#F59E0B" },
      ],
      summary: {
        total: "$1,600",
        average: "$228",
        highest: "$400 (Saturday)",
      },
    },
    Monthly: {
      chartData: [
        { name: "Week 1", amount: 1200 },
        { name: "Week 2", amount: 1500 },
        { name: "Week 3", amount: 1800 },
        { name: "Week 4", amount: 1300 },
      ],
      categories: [
        { name: "Food", value: 2400, color: "#22C55E" },
        { name: "Transport", value: 1200, color: "#8B5CF6" },
        { name: "Shopping", value: 2200, color: "#F59E0B" },
      ],
      summary: {
        total: "$5,800",
        average: "$1,450",
        highest: "$1,800 (Week 3)",
      },
    },
    Yearly: {
      chartData: [
        { name: "Jan", amount: 5800 },
        { name: "Feb", amount: 4200 },
        { name: "Mar", amount: 6500 },
        { name: "Apr", amount: 5200 },
        { name: "May", amount: 7100 },
        { name: "Jun", amount: 6800 },
      ],
      categories: [
        { name: "Food", value: 12000, color: "#22C55E" },
        { name: "Transport", value: 8000, color: "#8B5CF6" },
        { name: "Shopping", value: 15600, color: "#F59E0B" },
      ],
      summary: {
        total: "$35,600",
        average: "$5,933",
        highest: "$7,100 (May)",
      },
    },
  };

  const recentExpenses = [
    {
      id: 1,
      description: "Grocery Shopping",
      amount: "$85.50",
      category: "Food",
      date: "Today",
    },
    {
      id: 2,
      description: "Uber Ride",
      amount: "$12.30",
      category: "Transport",
      date: "Yesterday",
    },
    {
      id: 3,
      description: "Coffee Shop",
      amount: "$4.20",
      category: "Food",
      date: "2 days ago",
    },
    {
      id: 4,
      description: "Online Shopping",
      amount: "$156.80",
      category: "Shopping",
      date: "3 days ago",
    },
  ];

  return (
    <div
      className={`${styles.dashboardContainer} ${
        barActive ? styles.withSideBarActive : styles.withSideBarCollapsed
      }`}
    >
      <div className={styles.flexContainer}>
        <div className={styles.cardContainer}>
          <div className={styles.leftColumn}>
            <div>
              <h1 className={styles.heading}>Hello, Miss</h1>
              <p>Welcome back!</p>
            </div>

            <div className={styles.expenseContainer}>
              <h3>Total Expense</h3>
              <h2>$27,890</h2>
              <p>2% vs last 30 days</p>
            </div>
          </div>

          <div className={styles.pieCharContainer}>
            <PiChart
              selectedPeriod={selectedPeriod}
              expenseData={expenseData}
            />
          </div>
        </div>
        <div className={styles.sideContainer}>
          <h2 style={styles.subHeading}>AI Analaysis</h2>
          <h1 style={{margin: "8rem"}}>Coming Soon....</h1>
        </div>
      </div>

      <div className={styles.blockContainer}>
        <div
          className={styles.monthly}
          onClick={() => setSelectedPeriod("Monthly")}
        >
          <strong>Monthly</strong>
          <p>$1200</p>
        </div>
        <div
          className={styles.daily}
          onClick={() => setSelectedPeriod("Daily")}
        >
          <strong>Daily</strong>
          <p>$1200</p>
        </div>
        <div
          className={styles.yearly}
          onClick={() => setSelectedPeriod("Yearly")}
        >
          <strong>Yearly</strong>
          <p>$1200</p>
        </div>
      </div>

      <div className={styles.bflexContainer}>
        <div className={styles.spendingActivity}>
          <ExpenseStatistics
            selectedPeriod={selectedPeriod}
            expenseData={expenseData}
          />
        </div>
        <div className={styles.recentTransaction}>
          <h2 className={styles.subHeading}>Recent Expenses</h2>
          {recentExpenses.map((expense) => (
            <div className={styles.recentList}>
                <div>
                    <p style={{fontWeight: "bold"}}>{expense.category}</p>
                    <p >{expense.description}</p>
                </div>
                <span style={{fontWeight: "bold"}}>{expense.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
