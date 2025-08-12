import React from "react";
import { useState, useEffect } from "react";

function AddEventCard({ handleClick, events, setEvents, selectedEvent }) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    category: "",
    description: "",
    guests: [],
  });
  console.log(selectedEvent);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      id: prevState.id || generateId(),
      [name]: value,
    }));
  };
  function generateId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
  const handleChangeDate = (e) => {
    const { name, value } = e.target; // value is like "2025-09-25"

    const dateObj = new Date(value); // convert to Date object
    dateObj.setMonth(dateObj.getMonth() - 1); // subtract 1 month

    const newDate = dateObj.toISOString().split("T")[0];

    setFormData((prevState) => ({
      ...prevState,
      [name]: newDate, // update with new formatted date
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.date) {
      alert("All fields are required!");
      return;
    }
    if (selectedEvent) {
      const updatedEvents = events.map((event) =>
        event.id === selectedEvent.id ? formData : event
      );
      setEvents(updatedEvents);
    } else {
      setEvents((prevEvents) => [...prevEvents, formData]);
    }
    setFormData({
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      category: "",
      description: "",
      guests: [],
    });
    handleClick();
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

  useEffect(() => {
    if (selectedEvent) {
      setFormData(selectedEvent);
    }
  }, [selectedEvent]);

  return (
    <div className="addeventcard">
      <div>
        <div className="crossntit">
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
        </div>

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
            <option value="Meetings">Meetings</option>
            <option value="Webinars">Webinars</option>
            <option value="Birthday">Birthday</option>
            <option value="Exercises">Exercises</option>
            <option value="Networking">Networking</option>
            <option value="Lecture">Lecture</option>
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
          {selectedEvent === undefined ? (
            <button className="clear" onClick={handleClear}>
              Clear
            </button>
          ) : (
            <button className="clear" onClick={handleClick}>
              Cancel
            </button>
          )}
          <button className="save" onClick={handleSubmit}>
            {selectedEvent === undefined ? "Save" : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddEventCard;
