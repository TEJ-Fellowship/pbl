import React from "react";

function AddEventCard({handleClick}) {
  return (
    <div className="addeventcard">
      <div>
        <div className="crossntit">
        <div className="cross">
          <button onClick={handleClick}className="cross">X</button>
        </div>
        <input className="title" type="text" placeholder="Add Title" />
        </div>
        <hr className="tophr" />
        <div className="date">
          <h1>🗓️</h1>
          <input type="date" placeholder="Select Date" />
        </div>
        <div className="time">
          <h2>🕜</h2>
          <input className="startingTime" type="time" name="" id="" />
          <span className="dash">-</span>
          <input type="time" className="endingtime" name="" id="" />
        </div>
        <div className="categories">
          <h1>📃</h1>
          <select>
            <option value="">Select category</option>
            <option value="tech">Tech</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
        <div className="description">
          <h1>📃</h1>
          <input type="list" placeholder="Description here..." />
        </div>
        <div className="invite">
          <h1>🙍‍♀️</h1>
          <button className="inviteguest">Invite Guest</button>
        </div>
        <hr />
        <div className="btnn">
          <button className="clear">Clear</button>
          <button className="save"> Save</button>
        </div>
      </div>
    </div>
  );
}

export default AddEventCard;
