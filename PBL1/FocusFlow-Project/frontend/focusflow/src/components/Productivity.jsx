import React from "react";

function Productivity() {
  return (
    <div className="container">
      <h2>Productivity Overview</h2>
      <span>A snapshot of your task progress</span>
      <div className="subcontainer">
        <div className="total">
          <center>
            <h2>10</h2>
            <span>Total Tasks</span>
          </center>
        </div>
        <div className="complete">
          <center>
            <h2>2</h2>
            <span>Complete</span>
          </center>
        </div>
        <div className="pending">
          <center>
            <h2>8</h2>
            <span>Pending</span>
          </center>
        </div>
      </div>
    </div>
  );
}

export default Productivity;
