import React from "react";
import "../css/ShowEventCard.css";
function ShowEventCard({ handleShowEvent }) {
  return (
    <div className="showeventcard">
      <div className="header">
        <button  className="crossShow">
          ❕
        </button>
        <button  className="crossShow">
          🗑️
        </button>
        <button onClick={handleShowEvent} className="crossShow">
          X
        </button>
      </div>
      <hr className="tophrshow" />
      <div className="title">
        <h1>Header</h1>
        <p>time</p>
      </div>
      <div>
        <h2>description</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. At vel beatae sit optio culpa illo quas id est cumque libero. Magnam, quam exercitationem debitis optio ipsam enim rerum eius veritatis?</p>
      </div>

    </div>
  );
}

export default ShowEventCard;
