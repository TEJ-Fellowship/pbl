import React from "react";
import { useState } from "react";
import "../css/ShowEventCard.css";
import AddEventCard from "./AddEventCard";
import ShowDeleteCard from "./ShowDeleteCard";
function ShowEventCard({ handleShowEvent, selectedEvent,events,setEvents,setSelectedEvent }) {
  const [ShowDelete, setShowDelete] = useState(false);
  const [ShowUpdate, setShowUpdate] = useState(false);
  function handleshowUpdate(){
    setShowUpdate(!ShowUpdate)
  }
  function handleDelete() {
    setShowDelete(!ShowDelete);
  }
  return (
    <>
      <div className="showeventcard">
        <div className="header">
          <button className="crossShow" onClick={handleshowUpdate}>❕</button>
          <button className="crossShow" onClick={handleDelete}>
            🗑️
          </button>
          <button onClick={()=>{
            handleShowEvent()
            setSelectedEvent('')
          }} className="crossShow">
            X
          </button>
        </div>
        <hr className="tophrshow" />
        <div className="title">
          <h3>{selectedEvent.title}</h3>
          <p>
            <span>
              {selectedEvent.startTime}-{selectedEvent.endTime}
            </span>
          </p>
        </div>
        <div>
          <h3>Description</h3>
          <p className="des">{selectedEvent.description}</p>
        </div>
     
      </div>
         {ShowDelete ? <ShowDeleteCard handleShowEvent={handleShowEvent} handleDelete={handleDelete} selectedEvent={selectedEvent} events={events} setEvents={setEvents}/> : ""}
         {ShowUpdate ? <AddEventCard handleShowEvent={handleShowEvent} handleClick={handleshowUpdate} selectedEvent={selectedEvent} events={events} setEvents={setEvents}/> : ""}
    </>
  );
}

export default ShowEventCard;
