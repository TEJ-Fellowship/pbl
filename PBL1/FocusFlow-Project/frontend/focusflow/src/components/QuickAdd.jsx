import React, { useState } from "react";

function QuickAdd() {
  const [add, setAdd] = useState(false);
  return (
    <div className="container">
      <h2>Quick Task Entry</h2>
      <span>
        <pre>
          <span>
            <strong>Stay Focused. Stay Productive. Get it Done.</strong><br /><br />
            <p>Start by entering the details of your task.</p>
          </span>
        </pre>
      </span>
      <form action="">
        <input type="text" placeholder="Task Title (eg. Finish report!)" />
        <textarea name="description" id="description" placeholder="Description (optional)"></textarea>
        <div className="date-select-row">
          <input type="date" />
          <select id="task-category" name="taskCategory">
            <option value="all">All Tasks</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="study">Study</option>
            <option value="health">Health</option>
            <option value="finance">Finance</option>
          </select>

        </div>
        <button
          onClick={() => {
            setAdd(true);
          }}
        >
          {add ? "Added Task ✔" : "Add Task"}
        </button>
      </form>
    </div>
  );
}

export default QuickAdd;
