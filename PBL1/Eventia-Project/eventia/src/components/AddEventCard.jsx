import React from "react";
import { useState } from "react";

function AddEventCard({ handleClick, events, setEvents }) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    category: "",
    description: "",
    guests: [],
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  const handleChangeDate = (e) => {
  const { name, value } = e.target; // value is like "2025-09-25"
  
  const dateObj = new Date(value); // convert to Date object
  dateObj.setMonth(dateObj.getMonth() - 1); // subtract 1 month

  // Format back to "YYYY-MM-DD"
  const newDate = dateObj.toISOString().split("T")[0];

  setFormData((prevState) => ({
    ...prevState,
    [name]: newDate, // update with new formatted date
  }));
};


    const handleSubmit = () => {
    setEvents((prevEvents) => [...prevEvents, formData]);
    setFormData({
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      category: "",
      description: "",
      guests: [],
    });
  };
  const handleClear = () => {
    setFormData({
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      category: "",
      description: "",
      guests: [],
    });
  };

  return (
    <div className="addeventcard">
      <div>
        <div className="cross">
          <button onClick={handleClick} className="cross">
            X
          </button>
        </div>
        <input
          className="title"
          type="text"
          placeholder="Add Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
        <hr className="tophr" />
        <div className="date">
          <h1>🗓️</h1>
          <input
            type="date"
            placeholder="Select Date"
            name="date"
            value={formData.date}
            onChange={handleChangeDate}
          />
        </div>
        <div className="time">
          <h2>🕜</h2>
          <input
            className="startingTime"
            type="time"
            id=""
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
          />
          <span className="dash">-</span>
          <input
            type="time"
            className="endingtime"
            name="endTime"
            id=""
            value={formData.endTime}
            onChange={handleChange}
          />
        </div>
        <div className="categories">
          <h1>📃</h1>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Select category</option>
            <option value="tech">Meetings</option>
            <option value="design">Webinars</option>
            <option value="design">Birthday</option>
            <option value="design">Exercises</option>
            <option value="design">Networking</option>
            <option value="marketing">Classes</option>
          </select>
        </div>
        <div className="description">
          <h1>📃</h1>
          <input
            type="list"
            placeholder="Description here..."
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
        <div className="invite">
          <h1>🙍‍♀️</h1>
          <button className="inviteguest">Invite Guest</button>
        </div>
        <hr />
        <div className="btnn">
          <button className="clear" onClick={handleClear}>
            Clear
          </button>
          <button className="save" onClick={handleSubmit}> Save</button>
        </div>
      </div>
    </div>
  );
}

export default AddEventCard;
