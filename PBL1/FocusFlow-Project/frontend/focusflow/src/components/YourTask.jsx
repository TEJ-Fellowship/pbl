import React from "react";

function YourTask() {
  return (
    <div className="container">
      <h2>Your Tasks</h2>
      <nav>
        <ul>
          <li>All</li>
          <li>Work</li>
          <li>Personal</li>
          <li>Study</li>
          <li>Health</li>
          <li>Finance</li>
        </ul>
      </nav>
      <div className="TaskList">
        <span>Your Task List will be here!</span>
      </div>
    </div>
  );
}

export default YourTask;
