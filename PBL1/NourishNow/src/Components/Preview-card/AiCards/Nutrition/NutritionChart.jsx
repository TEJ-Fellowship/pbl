import React from "react";
import { Doughnut } from "react-chartjs-2";
import styles from "./NutritionChart.module.css";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function NutritionChart({ nutritionData }) {
  if (!nutritionData) return null;

  const chartLabels = ["Protein", "Carbohydrates", "Fats", "Water"];
  const chartValues = chartLabels.map(label =>
    parseFloat(nutritionData[label]?.replace(/[^\d.]/g, "") || 0)
  );

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor: ["#00ffd0", "#ff6384", "#36a2eb", "#ffce56"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className={styles.container}>
      <Doughnut data={chartData} />

      <div className={styles.legend}>
        {chartLabels.map((label, index) => (
          <div key={label} className={styles.legendItem}>
            <span
              className={styles.colorBox}
              style={{ backgroundColor: chartData.datasets[0].backgroundColor[index] }}
            />
            <span className={styles.label}>{label}:</span>
            <span className={styles.value}>{nutritionData[label]}</span>
          </div>
        ))}
      </div>

      <div className={styles.calories}>
        <strong>Total Calories: </strong>
        {nutritionData.Calories || "N/A"}
      </div>
    </div>
  );
}
