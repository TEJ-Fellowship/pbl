import React, { useState } from "react";
import CalendarHeader from "./CalendarHeader";
import CalendarBody from "./CalendarBody";

function Calendar() {
  const initialDate = new Date();
  const [month, setMonth] = useState(initialDate.getMonth());
  const [year, setYear] = useState(initialDate.getFullYear());
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

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
    <>
      <CalendarHeader
        month={months[month]}
        year={year}
        rightClick={rightClick}
        leftClick={leftClick}
        // onPrevious={goToPreviousMonth}
        // onNext={goToNextMonth}
      />
      <CalendarBody
        weeks={weeks}
        firstDay={firstDay}
        lastDate={lastDate}
        currentMonth={month}
        currentYear={year}
      />
    </>
  );
}

export default Calendar;
