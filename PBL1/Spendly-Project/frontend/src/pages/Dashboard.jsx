import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faPlus } from "@fortawesome/free-solid-svg-icons";

import styles from "./Dashboard.module.css";
import ExpenseStatistics from "./ExpenseStatistics";
import PiChart from "./PiChart";

function Dashboard({ barActive, expenses}) {
  const [selectedPeriod, setSelectedPeriod] = useState("Daily");


  // Utilities
  const getDayName = (dateStr) =>
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(dateStr).getDay()];
  const getMonthName = (dateStr) =>
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][new Date(dateStr).getMonth()];
  const getYear = (dateStr) => new Date(dateStr).getFullYear();

  // Initialize structures
  const dailyChart = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  const monthlyChart = {};
  const yearlyChart = {};
  const dailyCategory = {};
  const monthlyCategory = {};
  const yearlyCategory = {};

  // Convert
  expenses.forEach(({ amount, category, date }) => {
    const day = getDayName(date);
    const month = getMonthName(date);
    const year = getYear(date);

    // Daily
    if (dailyChart[day] !== undefined) dailyChart[day] += amount;
    dailyCategory[category] = (dailyCategory[category] || 0) + amount;

    // Monthly
    monthlyChart[month] = (monthlyChart[month] || 0) + amount;
    monthlyCategory[category] = (monthlyCategory[category] || 0) + amount;

    // Yearly
    yearlyChart[year] = (yearlyChart[year] || 0) + amount;
    yearlyCategory[category] = (yearlyCategory[category] || 0) + amount;
  });

  // Color Palette (8 distinct)
  const categoryColors = [
    "#22C55E", // green
    "#8B5CF6", // purple
    "#F59E0B", // amber
    "#EF4444", // red
    "#0EA5E9", // sky
    "#A855F7", // violet
    "#10B981", // emerald
    "#F97316", // orange
  ];

  // Converters
  const toChartArray = (obj) =>
    Object.entries(obj).map(([name, amount]) => ({ name, amount }));

  const toCategoryArray = (obj) => {
    const entries = Object.entries(obj);
    return entries.map(([name, value], index) => ({
      name,
      value,
      color: categoryColors[index % categoryColors.length], // use only 8 colors
    }));
  };

  const getTotal = (data) =>
    data.reduce((sum, item) => sum + item.amount, 0).toFixed(2);

  // Final Structure
  const expenseData = {
    Daily: {
      chartData: toChartArray(dailyChart),
      categories: toCategoryArray(dailyCategory),
      total: getTotal(toChartArray(dailyChart)),
    },
    Monthly: {
      chartData: toChartArray(monthlyChart),
      categories: toCategoryArray(monthlyCategory),
      total: getTotal(toChartArray(monthlyChart)),
    },
    Yearly: {
      chartData: toChartArray(yearlyChart),
      categories: toCategoryArray(yearlyCategory),
      total: getTotal(toChartArray(yearlyChart)),
    },
  };

  console.log(expenseData);



const dailyTotal = expenseData.Daily.total;
const monthlyTotal = expenseData.Monthly.total;
const yearlyTotal = expenseData.Yearly.total;

const totalExpense = parseFloat(dailyTotal + monthlyTotal + yearlyTotal).toFixed(2)
console.log(totalExpense)


  const navigate = useNavigate()
  function handleAddExpense() {
    navigate("/add-expense");
  }

  const recentExpenses = expenses.slice(0, 4)

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
            <div className={styles.addBtn} >
              <FontAwesomeIcon icon={faPlus} className={styles.plus} onClick={handleAddExpense} />
            </div>
            <div className={styles.expenseContainer}>
              <h3>Total Expense</h3>
              <h2>${totalExpense}</h2>
              {/* <p>2% vs last 30 days</p> */}
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
          <p>${monthlyTotal}</p>
        </div>
        <div
          className={styles.daily}
          onClick={() => setSelectedPeriod("Daily")}
        >
          <strong>Daily</strong>
          <p>${dailyTotal}</p>
        </div>
        <div
          className={styles.yearly}
          onClick={() => setSelectedPeriod("Yearly")}
        >
          <strong>Yearly</strong>
          <p>${yearlyTotal}</p>
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
            <div className={styles.recentList} key={expense.id}>
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
