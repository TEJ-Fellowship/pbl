import React, { useState } from "react";
import "../home.css";
import Quote from "./Quote";



function Home({ goals ,setAllGoals}) {

  // const [editingId, setEditingId] = useState(null);

  function handleDeleteButton(taskID) {
     let updategoal= goals.map((goal) =>{
      let updatetask = goal.tasks.filter((g) => g.id !== taskID);
      return {...goal,tasks:updatetask}
     });
     setAllGoals(updategoal);
  }

  return (
    <>
    <Quote/>
    <div className="home-container">
      <h2>Your goals</h2>
      {goals.length === 0 ? (
        <p>"No goals"</p>
      ) : (
        <div className="goal-list">
          {goals.map((goal) => (
            <div className="goal-card" key={goal.id}>
              <h4 className="goal-title">{goal.title}</h4>

              <ul className="task-list" style={{ padding: "2px" }}>
                {goal.tasks.map((task) => (
                  <li key={task.id} style={{ listStyle: "none" }}>
                    <input type="checkbox" style={{ marginRight: "10px" }} />
                    {task.text}
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditingId(task.id);
                      }}
                    >
                      edit
                    </button>
                    <button className="delete-btn"
                    onClick={() => 
                        {handleDeleteButton(task.id)
                      }
                        
                        
                      }
                    >delete</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}

export default Home;
