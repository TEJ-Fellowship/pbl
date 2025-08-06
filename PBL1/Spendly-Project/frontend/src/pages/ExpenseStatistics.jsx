import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import styles from "./ExpenseStatistics.module.css";

const ExpenseStatistics = ({ selectedPeriod, expenseData }) => {
  const currentData = expenseData[selectedPeriod];

  return (
    <>
      <div className={styles.statisticsContainer}>
        <h3 className={styles.subHeading}>
          Expense Statistics - {selectedPeriod}
        </h3>
        <div className={styles.chartContainer}>
          <p>{selectedPeriod} Spending Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={currentData.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="amount" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default ExpenseStatistics
