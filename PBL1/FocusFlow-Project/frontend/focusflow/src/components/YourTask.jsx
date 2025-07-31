import React from "react";
import List from "../assets/list.png";
import Grid from "../assets/menu.png";

function YourTask() {
  return (
    <div className="container">
      <h2>Your Tasks</h2>
      <nav className="task-nav">
        <ul className="categories">
          <li>All</li>
          <li>Work</li>
          <li>Personal</li>
          <li>Study</li>
          <li>Health</li>
          <li>Finance</li>
        </ul>
        <ul className="icon-buttons">
          <li className="grp-item">
            <img src={Grid} alt="grid" />
          </li>
          <li className="grp-item">
            <img src={List} alt="list" />
          </li>
        </ul>
      </nav>

      <div className="TaskList">
        <span>Your Task List will be here!</span>
      </div>
    </div>
  );
}

export default YourTask;
