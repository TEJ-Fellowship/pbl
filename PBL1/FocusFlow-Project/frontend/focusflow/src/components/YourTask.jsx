import React, { useState } from "react";
import List from "../assets/list.png";
import Grid from "../assets/menu.png";
import "../styles/YourTask.css";

function YourTask({ tasks, onCompleteTask, onDeleteTask }) {
  const [fadingTasks, setFadingTasks] = useState([]);

  if (tasks.length === 0)
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
          <span>Your Task List is empty!</span>
        </div>
      </div>
    );
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
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`mytask${task.isComplete ? " completed" : ""}${
              fadingTasks.includes(task.id) ? " fade-out" : ""
            }`}
          >
            <h4
              className="checkbox-btn"
              style={{
                cursor: task.isComplete ? "default" : "pointer",
                color: task.isComplete ? "#aaa" : "#333",
                transition: "color 0.3s, opacity 0.5s",
                opacity: task.isComplete ? 0.5 : 1,
              }}
              onClick={() => {
                if (!task.isComplete && !fadingTasks.includes(task.id)) {
                  onCompleteTask(task.id);
                  setFadingTasks((prev) => [...prev, task.id]);
                  setTimeout(() => {
                    setFadingTasks((prev) =>
                      prev.filter((id) => id !== task.id)
                    );
                  }, 500); // 500ms fade duration
                }
              }}
            >
              {task.isComplete ? "✓" : "☐"}
            </h4>
            <span>
              <center>
                <h3
                  style={{
                    textDecoration: task.isComplete ? "line-through" : "none",
                    color: task.isComplete ? "#aaa" : undefined,
                  }}
                >
                  {task.title}
                </h3>
              </center>
            </span>
            <span>
              <p>
                <h5>Description:</h5>
                <span style={{ color: task.isComplete ? "#aaa" : undefined }}>
                  {task.description}
                </span>
              </p>
            </span>
            <br />
            <span>
              <h5>Category:</h5> " {task.category} "
            </span>
            <hr />
            <span>
              <strong>DueDate: </strong>
              {task.duedate}
            </span>
            <button
              className="delete-btn"
              style={{
                marginLeft: 10,
                background: "#dc5759ff",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "4px 10px",
                cursor: "pointer",
              }}
              onClick={() => onDeleteTask(task.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default YourTask;
