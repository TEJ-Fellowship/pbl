import { useState } from "react";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file

import { DateRange } from "react-date-range";

import { addDays } from "date-fns";
import "./CalenderTheme.css"

function Calender({onRangeChange}) {
  const [state, setState] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      key: "selection",
    },
  ]);

const handleSelect = (ranges) => {
  const {startDate, endDate} = ranges.selection;
  setState([ranges.selection]);
  onRangeChange(startDate, endDate);
}

  return (
    <>
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}
      >
        <DateRange
          editableDateInputs={true}
          onChange={handleSelect}
          moveRangeOnFirstSelection={false}
          ranges={state}
        />
      </div>
    </>
  );
}

export default Calender;
