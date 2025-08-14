import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

/**
 * Register required Chart.js components for the temperature chart
 * Includes scales, elements, plugins for tooltips, legends, and area fills
 */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Chart = ({ forecastData, onClose, cityName }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    // Handle click outside to close chart
    const handleClickOutside = (event) => {
      if (chartRef.current && !chartRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    // Cleanup event listener on component unmount
    // This prevents memory leaks and ensures the event listener is removed when the component is no longer in use
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // If no forecast data is available, display a message
  // This is a fallback to ensure the user knows why the chart isn't displaying
  if (!forecastData || forecastData.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div ref={chartRef} className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-4">Unable to load forecast data</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

   /**
   * Chart configuration object
   * Sets up three datasets: Maximum, Minimum, and Average temperatures
   */
  const chartData = {
    labels: forecastData.map(day => day.date),
    datasets: [
      {
        label: 'Max Temperature (°C)',
        data: forecastData.map(day => day.maxTemp), // Extract max temperatures from forecast data
        borderColor: 'rgb(239, 68, 68)',  // Red color for max temperature
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Light red background
        tension: 0.4,   // Smooth curve
        pointBackgroundColor: 'rgb(239, 68, 68)', // Red point color
        pointBorderColor: '#fff', // White point border
        pointBorderWidth: 2, 
        pointRadius: 6, // Larger point size
        pointHoverRadius: 8, // Larger hover point size
        fill: false  // No fill under the line
      },
      {
        label: 'Min Temperature (°C)',
        data: forecastData.map(day => day.minTemp), // Extract min temperatures from forecast data
        borderColor: 'rgb(59, 130, 246)',  // Blue color for min temperature
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // Light blue background
        tension: 0.4, 
        pointBackgroundColor: 'rgb(59, 130, 246)', // Blue point color
        pointBorderColor: '#fff', 
        pointBorderWidth: 2, 
        pointRadius: 6, 
        pointHoverRadius: 8, 
        fill: false 
      },
      {
        label: 'Average Temperature (°C)',
        data: forecastData.map(day => day.avgTemp), // Extract average temperatures 
        borderColor: 'rgb(34, 197, 94)', // Green color for average temperature
        backgroundColor: 'rgba(34, 197, 94, 0.1)', // Light green background
        tension: 0.4, 
        pointBackgroundColor: 'rgb(34, 197, 94)', // Green point color
        pointBorderColor: '#fff', 
        pointBorderWidth: 2, 
        pointRadius: 6, 
        pointHoverRadius: 8, 
        fill: '+1' // Fill area under the average temperature line
      }
    ]
  };

  /**
   * Chart options configuration
   * Controls the appearance and behavior of the chart
   */
  const options = {
    responsive: true,  // Make the chart responsive to window size
    maintainAspectRatio: false, // Don't maintain aspect ratio
    plugins: {  
      // Legend configuration for displaying dataset labels
      legend: {   
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      // Title configuration for the chart
      title: {
        display: true,
        text: `5-Day Temperature Trend - ${cityName}`,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      // Tooltip configuration for displaying data points
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark background
        titleColor: '#fff', // White title color
        bodyColor: '#fff', // White body color
        borderColor: 'rgba(255, 255, 255, 0.2)', // Light gray border
        borderWidth: 5, // Thin border
        callbacks: {
          /**
           * Formats the tooltip label for temperature data points
           * @param {Object} context - The chart context object
           * @param {Object} context.dataset - Contains dataset information including label
           * @param {Object} context.parsed - Contains the parsed data values
           * @param {number} context.parsed.y - The Y-axis value (temperature)
           * @returns {string} Formatted string showing temperature with label and unit
           */
          label: function(context) {
            return ` ${context.dataset.label} : ${context.parsed.y}°C`;
          }
        }
      }
    },
      // Axis configurations
    scales: {
      y: {
        // Y-axis configuration for temperature values
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return value + '°C';
          }
        }
      },
      x: {
         // X-axis configuration for dates
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
     // Interaction configuration for hover effects
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       {/* Main chart container */}
      <div ref={chartRef} className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
           {/* Chart header with close button */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Temperature Forecast</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close chart"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Chart component container */}
          <div className="h-96">
            <Line data={chartData} options={options} />
          </div>
          
           {/* Daily weather summary grid */}
          <div className="mt-6 grid grid-cols-5 gap-2">
            {forecastData.map((day, index) => (
              <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-600 mb-1">{day.date}</div>
                <div className="text-sm">
                  <span className="text-red-500 font-semibold">{day.maxTemp}°</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span className="text-blue-500 font-semibold">{day.minTemp}°</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{day.weather}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chart; 