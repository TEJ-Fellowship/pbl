import React, { useState } from "react";

function QuickAdd() {
  const [add, setAdd] = useState(false);
  return (
    <div className="container">
      <h2>Quick Add Your Daily Task</h2>
      <span>
        <pre>
          <span>
            <strong>Track! Conquer!! Succeed!!!</strong>
            <p>Enter details for your new task below!</p>
          </span>
        </pre>
      </span>
      <form action="">
        <input type="text" placeholder="Task Title (eg. Finish report!)" />
        <textarea name="description" id="description"></textarea>
        <input type="date" />
        <select id="task-category" name="taskCategory">
          <option value="all">All Tasks</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="study">Study</option>
          <option value="health">Health</option>
          <option value="finance">Finance</option>
        </select>
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
