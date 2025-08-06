import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import styles from "./PiChart.module.css";
const PiChart = ({ selectedPeriod, expenseData }) => {
  const currentCategoryData = expenseData[selectedPeriod];
  return (
    <>
      <div className={styles.pieContainer}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={currentCategoryData.categories}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {currentCategoryData.categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value) => [
                `${currentCategoryData.categories.name} $${value}`,
                "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div>
          <p className={styles.subHeading}>Category</p>
          <div className={styles.categoryContainer}>
            {currentCategoryData.categories.map((category, index) => (
              <div key={index} className={styles.category}>
                <div
                  className={styles.dot}
                  style={{ backgroundColor: `${category.color}` }}
                ></div>
                <span>{category.name}</span>
                <span>${category.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PiChart;
