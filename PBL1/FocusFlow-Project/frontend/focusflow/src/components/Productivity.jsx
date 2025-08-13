import React, { useState } from "react";

function Productivity({ tasks }) {
  const total = tasks.length;
  const complete = tasks.filter((t) => t.isComplete).length;
  const pending = total - complete;
  return (
    <section id="overview">
      <div className="container">
        <h2>Productivity Overview</h2>
        <span>A snapshot of your task progress</span>
        <div className="subcontainer">
          <div className="total">
            <center>
              <h2>{total}</h2>
              <span>Total Tasks</span>
            </center>
          </div>
          <div className="complete">
            <center>
              <h2>{complete}</h2>
              <span>Complete</span>
            </center>
          </div>
          <div className="pending">
            <center>
              <h2>{pending}</h2>
              <span>Pending</span>
            </center>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Productivity;
