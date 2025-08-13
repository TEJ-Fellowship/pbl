import React, { useState } from "react";

function QuickAdd({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duedate, setDuedate] = useState("");
  const [category, setCategory] = useState("all");
  const [add, setAdd] = useState(false);
  const submithandler = (e) => {
    e.preventDefault();

    if (!title.trim()) return;

    const newTask = {
      id: Date.now(),
      title,
      description, //[{},{}]
      duedate,
      category,
    };

    onAdd(newTask);

    setAdd(true);

    setTitle("");
    setDescription("");
    setDuedate("");
    setCategory("all");
    setTimeout(() => setAdd(false), 1000);
  };
  return (
    <section id="newtask">
      <div className="container">
        <h2>Quick Task Entry</h2>
        <span>
          <pre>
            <span>
              <strong>Stay Focused. Stay Productive. Get it Done.</strong>
              <br />
              <br />
              <p>Start by entering the details of your task.</p>
            </span>
          </pre>
        </span>
        <form action="" onSubmit={submithandler}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task Title (eg. Finish report!)"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            name="description"
            id="description"
            placeholder="Description (optional)"
            required
          ></textarea>
          <div className="date-select-row">
            <input
              type="date"
              value={duedate}
              onChange={(e) => setDuedate(e.target.value)}
              required
            />
            <select
              id="task-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              name="taskCategory"
              required
            >
              <option value="all">All Tasks</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="study">Study</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
            </select>
          </div>
          <button type="submit">{add ? "Added Task ✔" : "Add Task"}</button>
        </form>
      </div>
    </section>
  );
}

export default QuickAdd;
