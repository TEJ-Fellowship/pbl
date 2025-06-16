export const weekDaysName = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 *
 * @param {number} dateUnix unix date is in second
 * @param {number} timezone timezone shift from UTC in seconds
 * @returns {string} e.g. 'Sunday, 15, June'
 */
export const getDate = (dateUnix, timezone) => {
  const date = new Date((dateUnix + timezone) * 1000);
  const weekDay = weekDaysName[date.getUTCDay()];
  const monthName = monthNames[date.getUTCMonth()];
  const dayNumber = date.getUTCDate();
  return `${weekDay}, ${dayNumber}, ${monthName}`;
};

/**
 *
 * @param {number} dateUnix unix date is in second
 * @param {number} timezone timezone shift from UTC in seconds
 * @returns {string} e.g. format: HH:MM AM/PM ->'12:00 PM'
 */
export const getTime = (unixTimestamp, timezoneOffset = 0) => {
  // Convert Unix timestamp (seconds) to milliseconds and adjust for timezone
  const date = new Date((unixTimestamp + timezoneOffset) * 1000);

  // Get hours and minutes in UTC (already adjusted by timezoneOffset)
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();

  // Format minutes to always be 2 digits
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  // Determine AM/PM
  const period = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  const formattedHours = hours % 12 || 12;

  return `${formattedHours}:${formattedMinutes} ${period}`;
};

export const mps_to_kmh = (mps) => {
  return mps * 3.6;
};

export const formatPressure = (pressure) => `${pressure} hPa`;

export const formatVisibility = (visibility) => {
  if (visibility < 1000) {
    // Show as meters if < 1km
    return `${visibility} meters`;
  }
  return `${(visibility / 1000).toFixed(1)} km`;
};

export const getPressureDescription = (pressure) => {
  if (pressure > 1022) return "Higher than average pressure";
  if (pressure < 1009) return "Lower than average pressure";
  return "Normal pressure range";
};
