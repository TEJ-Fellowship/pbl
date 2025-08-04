import React from "react";
import AngleButton from "./AngleButton";
import "../css/CalendarHeader.css";

function CalendarHeader({ month, year,leftClick,rightClick}) {
  return (
    <div className="calenderheader">
      <AngleButton text="<" onClick={leftClick}/>
      <AngleButton text={`🔻${month}`} />
      <AngleButton text={`🔻${year}`} />
      <AngleButton text=">"  onClick={rightClick}/>
    </div>
  );
}

export default CalendarHeader;
