import React from "react";
import { FaPlus } from "react-icons/fa";
import { useState } from "react";

function GoalForm({ onSubmit }) {
  const [goalTitle, setGoalTitle] = useState("");
  //to change the state of input field, at first the input field is not displayed.
  const [showInputField, setShowInputField] = useState(false);
  //to keep the track of text entered by the user
  const [taskText, setShowTaskText] = useState("");
  //to keep track of all the tasks entered by the user and render it
  const [allTasks, setAllTasks] = useState([]);

  const handleAddTaskClick = () => {
    setShowInputField(true); //add task button is clicked.
  };

  const handleInputText = (e) => {
    setShowTaskText(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (taskText.trim() === "") return;

    const newTask = {
      id: Date.now(),
      text: taskText.trim(),
    };

    setAllTasks([...allTasks, newTask]);
    setShowTaskText("");
  };

  const handleCreateGoal = () => {
    // let updated = [...allTasks];
    // if(taskText.trim() !==""){
    //   updated.push({id:Date.now(),text:taskText.trim()});
    // }
    console.log("All Tasks:", allTasks);
    const task = {
      id: Date.now(),
      title: goalTitle,
      tasks: allTasks,
    };
    onSubmit(task);
    console.log("Submitted Goal:", task);
  };

  return (
    <div>
      <div id="container">
        <h4>Fitness</h4>
        <input
          type="text"
          placeholder="Goal title"
          value={goalTitle}
          onChange={(e) => setGoalTitle(e.target.value)}
        ></input>

        <button id="add-task" onClick={handleAddTaskClick}>
          <FaPlus />
          Add task
        </button>

        {showInputField && (
          <form onSubmit={handleSubmit} style={{ marginTop: 10 }}>
            <input
              type="text"
              value={taskText}
              onChange={handleInputText}
              placeholder="Enter a task"
              required
            />
          </form>
        )}

        <ul style={{ marginTop: 20 }}>
          {allTasks.map((task) => {
            return (
              <li
                key={task.id}
                style={{
                  background: "#f0f0f0",
                  padding: "10px",
                  marginBottom: "8px",
                  borderRadius: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {task.text}
              </li>
            );
          })}
        </ul>

        <div id="buttons">
          <button id="create" onClick={handleCreateGoal}>
            Create Goal
          </button>
          <button id="cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default GoalForm;
