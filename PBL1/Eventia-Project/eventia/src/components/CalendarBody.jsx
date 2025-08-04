import React from "react";
import "../css/CalendarBody.css";
function CalendarBody({
  weeks,
  firstDay,
  lastDate,
  currentYear,
  currentMonth,
}){
  const date=new Date()
  const actualYear=date.getFullYear()
  const actualMonth=date.getMonth()
  const actualDate=date.getDate()
  console.log(actualDate,actualMonth,actualYear)
  const generateCalendarDays = () => {
    const calendarDays = [];
    let CountDay = 0;
    for (let i = 0; i < 6; i++) {
      let week = [];
      for (let j = 0; j < 7; j++) {
        let cellContent = "";
        let isToday=false;
        if(CountDay===actualDate &&
          currentMonth===actualMonth && currentYear===actualYear
        ){
             isToday=true;
        }
        if (j < firstDay && i === 0) {
          cellContent = "";
        } else if (CountDay < lastDate) {
          cellContent = CountDay;
          CountDay++;
        } else {
          cellContent = "";
        }
        week.push({ content: cellContent,isToday:isToday, key: `${i}-${j}` });
      }
      calendarDays.push(week);
    }
    return calendarDays;
  };
  const calendarDays = generateCalendarDays();
  return (
    <div className="calendarbody">
      <table>
        <thead>
          <tr className="trr">
            {weeks.map((day, index) => {
              return (
                <th key={index}>
                  <h3>{day}</h3>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {calendarDays.map((week,i) => {
            return (
              <tr key={i}>
                {week.map((day) => {
                  return <td key={day.key} className={day.isToday?'current':''}>{day.content}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CalendarBody;
