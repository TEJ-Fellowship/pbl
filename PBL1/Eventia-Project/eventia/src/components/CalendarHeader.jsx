import React from "react";
import AngleButton from "./AngleButton";
import "../css/CalendarHeader.css";

function CalendarHeader({ month, year, leftClick, rightClick ,handleSelectMonth,handleSelectYear}) {

  let years = [];
  for (let year = 2015; year <= 2050; year++) {
    years.push({ year: year, value: year });
  }
  const months = [
  { month: "January", value: 0 },
  { month: "February", value: 1 },
  { month: "March", value: 2 },
  { month: "April", value: 3 },
  { month: "May", value: 4},
  { month: "June", value: 5 },
  { month: "July", value: 6},
  { month: "August", value: 7},
  { month: "September", value: 8},
  { month: "October", value:9 },
  { month: "November", value: 10 },
  { month: "December", value: 11 }
];


  return (
    <div className="calenderheader">
      <AngleButton text="<" onClick={leftClick} />
      <select onChange={handleSelectMonth} id="myDropdownMonth" name="myDropdown">
        {months.map((monthh) => {
          return (
            <option value={monthh.value} key={monthh.month} selected={monthh.month === month}>
            {monthh.month}
            </option>
          );
        })}
      </select>
      <select onChange={handleSelectYear} id="myDropdownYear" name="myDropdown">
        {years.map((yearr) => {
          return (
            <option  value={yearr.value}  key={yearr.year} selected={yearr.value === year} >
              {yearr.year}
            </option>
          );
        })}
      </select>

      <AngleButton text=">" onClick={rightClick} />
    </div>
  );
}

export default CalendarHeader;
