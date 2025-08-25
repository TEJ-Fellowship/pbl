import React, { useState, useEffect } from "react";
import CalendarHeader from "./CalendarHeader";
import CalendarBody from "./CalendarBody";
import { fetchHolidays, formatHolidays } from "../../api/holidayapi";

function Calendar({events, setEvents, selectedCountry = "np", showHolidays}) {
  const initialDate = new Date();
  const [month, setMonth] = useState(initialDate.getMonth());
  const [year, setYear] = useState(initialDate.getFullYear());
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const [holidays, setHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [holidayError, setHolidayError] = useState(null);

  // Add console log to track country changes
  useEffect(() => {
    console.log("Country changed to:", selectedCountry);
    setLoadingHolidays(true);
    setHolidayError(null);
    fetchHolidays(selectedCountry, year)
      .then((data) => {
        console.log("Holidays fetched:", data ? data.length : 0);
        setHolidays(formatHolidays(data));
      })
      .catch((err) => {
        console.error("Holiday fetch error:", err);
        setHolidayError("Failed to load holidays");
      })
      .finally(() => setLoadingHolidays(false));
  }, [selectedCountry, year]);

  function leftClick() {
    let mon = month - 1;
    if (mon < 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(mon);
    }
  }

  function rightClick() {
    let mon = month + 1;
    if (mon > 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(mon);
    }
  }
  function selectHandleMonth(e){
     
      setMonth(parseInt(e.target.value))
  
  }
    function selectHandleYear(e){
     
      setYear(parseInt(e.target.value))
  
  }
 
  const weeks = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const months = [
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

  return (
    <div className="calendar">
      <CalendarHeader 
        month={months[month]}
        year={year}
        rightClick={rightClick}
        leftClick={leftClick}
        handleSelectMonth={selectHandleMonth}
        handleSelectYear={selectHandleYear}
      />
      <CalendarBody
        weeks={weeks}
        firstDay={firstDay}
        lastDate={lastDate}
        currentMonth={month}
        currentYear={year}
        events={events}
        setEvents={setEvents}
        holidays={holidays}
        showHolidays={showHolidays}
      />
    </div>
  );
}

export default Calendar;
