import React from "react";
import "../css/ShowDeleteCard.css";
function ShowDeleteCard({handleDelete,selectedEvent,events,setEvents,handleShowEvent}) {
    function handleDeleteSubmit(){
        let restItems=events.filter((item)=>{
            return selectedEvent.id!==item.id
        })
        setEvents(restItems)
        alert(`${selectedEvent.title} has been deleted `)
         handleShowEvent();   
    }
  return (
    <div className="showdeletecard">
      <div className="headerr">
        <h2 className="deletetitle">Delete Event ?</h2>
        <button onClick={handleDelete} className="crossShoww">
          X
        </button>
      </div>
      <hr className="tophrrshow" />
      <div className="areyou">
        <h4>Are you sure you want to delete this event?</h4>
        <p>
          {selectedEvent.title}
        </p>
        <h6>
          {selectedEvent.date} <span>{selectedEvent.startTime}-{selectedEvent.endTime}</span>
        </h6>
      </div>
      <div className="buttondiv">
          <button className="no" onClick={handleDelete}>
            No
          </button>
          <button onClick={handleDeleteSubmit} className="delete"> Delete</button>
      </div>
    </div>
  );
}

export default ShowDeleteCard;
