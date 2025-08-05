import React from "react";
import { FaPlus } from "react-icons/fa";
import { useState } from "react";

function GoalForm({onSubmit}) {

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

    setAllTasks([...allTasks, taskText.trim()]);
    setShowTaskText("");
  };


  const handleCreateGoal = ()=>{
    const task={
      title:taskText,
      tasks: allTasks,
    }
    onSubmit(task)
  }

  return (
    <div>
      <div id="container">


        <h4>Fitness</h4>
        <input type="text" placeholder="Goal title"></input>

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
          {allTasks.map((task, index) => {
            return (
              <li
                key={index}
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
                {task}
              </li>
            );
          })}
        </ul>

        <div id="buttons">
          <button id="create" onClick={handleCreateGoal}>Create Goal</button>
          <button id="cancel">Cancel</button>
        </div>


      </div>
    </div>
  );
}

export default GoalForm;


