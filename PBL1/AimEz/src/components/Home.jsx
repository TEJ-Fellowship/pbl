import React from "react";
import "../home.css";

function Home({goals}) {
  return (

    <div className="home-container">
      <h2>Your goals</h2>

      {goals.length === 0 ? (
        <p>"No goals"</p>
      ) : (
        <div className="goal-list">
        {goals.map((goal, index) => (

          <div className="goal-card" key={index}>
            <h4 className="goal-title">{goal.title}</h4>


            <ul className="task-list" style={{padding:"2px"}}>
              {goal.tasks.map((task, index) => (
                <li key={index} style={{listStyle:"none"}}> 
                
                <input type='checkbox' style={{ marginRight: "10px" }}/>
                {task} 
                <button className="edit-btn">edit</button>
                <button className="delete-btn">delete</button>
                </li>

              ))}
            </ul>
          </div>
        ))}
    </div>
  )}
  </div>
  )}

export default Home;
