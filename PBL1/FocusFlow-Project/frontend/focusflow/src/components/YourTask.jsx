import React, { useState } from "react";
import List from "../assets/list.png";
import Grid from "../assets/menu.png";
import "../styles/YourTask.css";

function YourTask({ tasks, onCompleteTask, onDeleteTask }) {
  const [fadingTasks, setFadingTasks] = useState([]);
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("list"); // yo list ra grid ko lagi ho!

  const filteredTasks =
    filter === "All"
      ? tasks
      : tasks.filter(
          (task) =>
            task.category &&
            task.category.toLowerCase() === filter.toLowerCase()
        );

  const categories = ["All", "Work", "Personal", "Study", "Health", "Finance"];

  if (filteredTasks.length === 0) {
    return (
      <div className="container">
        <h2>Your Tasks</h2>
        <nav className="task-nav">
          <ul className="categories">
            {categories.map((cat) => (
              <li
                key={cat}
                className={filter === cat ? "active-category" : ""}
                style={{
                  cursor: "pointer",
                  fontWeight: filter === cat ? "bold" : "normal",
                }}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </li>
            ))}
          </ul>
          <ul className="icon-buttons">
            <li
              className={`grp-item${view === "grid" ? " active-icon" : ""}`}
              onClick={() => setView("grid")}
              style={{ cursor: "pointer" }}
            >
              <img src={Grid} alt="grid" />
            </li>
            <li
              className={`grp-item${view === "list" ? " active-icon" : ""}`}
              onClick={() => setView("list")}
              style={{ cursor: "pointer" }}
            >
              <img src={List} alt="list" />
            </li>
          </ul>
        </nav>
        <div className={`TaskList ${view}-view`}>
          <span>
            {tasks.length === 0
              ? "Your Task List is empty!"
              : "There is no any task in this category."}
          </span>
        </div>
      </div>
    );
  }
  return (
    <section id="mytask">
      <div className="container">
        <h2>Your Tasks</h2>
        <nav className="task-nav">
          <ul className="categories">
            {categories.map((cat) => (
              <li
                key={cat}
                className={filter === cat ? "active-category" : ""}
                style={{
                  cursor: "pointer",
                  fontWeight: filter === cat ? "bold" : "normal",
                }}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </li>
            ))}
          </ul>
          <ul className="icon-buttons">
            <li
              className={`grp-item${view === "grid" ? " active-icon" : ""}`}
              onClick={() => setView("grid")}
              style={{ cursor: "pointer" }}
            >
              <img src={Grid} alt="grid" />
            </li>
            <li
              className={`grp-item${view === "list" ? " active-icon" : ""}`}
              onClick={() => setView("list")}
              style={{ cursor: "pointer" }}
            >
              <img src={List} alt="list" />
            </li>
          </ul>
        </nav>

        <div className={`TaskList ${view}-view`}>
          {filteredTasks.map((task) =>
            view === "grid" ? (
              <div
                key={task.id}
                className={`mytask${task.isComplete ? " completed" : ""}${
                  fadingTasks.includes(task.id) ? " fade-out" : ""
                }`}
              >
                <button
                  className="checkbox-btn"
                  style={{
                    cursor: task.isComplete ? "default" : "pointer",
                    color: task.isComplete ? "#aaa" : "#333",
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
                      }, 500);
                    }
                  }}
                  aria-label={
                    task.isComplete ? "Task completed" : "Mark task as complete"
                  }
                  disabled={task.isComplete}
                >
                  {task.isComplete ? "✓" : "☐"}
                </button>
                <div className="mytask-content">
                  <h3>{task.title}</h3>
                  <p>
                    <h5>Description:</h5>
                    {task.description}
                  </p>
                  <div className="category">
                    <h5>Category:</h5> {task.category}
                  </div>
                  <div className="duedate">
                    <strong>DueDate:</strong> {task.duedate}
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => onDeleteTask(task.id)}
                  aria-label="Delete task"
                >
                  Delete
                </button>
              </div>
            ) : (
              <div
                key={task.id}
                className={`mytask list-item${
                  task.isComplete ? " completed" : ""
                }${fadingTasks.includes(task.id) ? " fade-out" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 8px",
                  borderBottom: "1px solid #eee",
                  background: "#fff",
                  borderRadius: "8px",
                }}
              >
                <button
                  className="checkbox-btn"
                  style={{
                    cursor: task.isComplete ? "default" : "pointer",
                    color: task.isComplete ? "#aaa" : "#333",
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
                      }, 500);
                    }
                  }}
                  aria-label={
                    task.isComplete ? "Task completed" : "Mark task as complete"
                  }
                  disabled={task.isComplete}
                >
                  {task.isComplete ? "✓" : "☐"}
                </button>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "1.1rem",
                      textDecoration: task.isComplete ? "line-through" : "none",
                      color: task.isComplete ? "#aaa" : undefined,
                    }}
                  >
                    {task.title}
                  </span>
                  <span style={{ marginLeft: 12, color: "#666" }}>
                    <strong>Category:</strong> {task.category}
                  </span>
                  <span style={{ marginLeft: 12, color: "#888" }}>
                    <strong>Due:</strong> {task.duedate}
                  </span>
                  <span
                    style={{ display: "block", marginTop: 4, color: "#444" }}
                  >
                    <strong>Description:</strong> {task.description}
                  </span>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => onDeleteTask(task.id)}
                  aria-label="Delete task"
                >
                  Delete
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

export default YourTask;
