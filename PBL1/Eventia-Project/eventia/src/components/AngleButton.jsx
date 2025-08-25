import React from "react";

function AngleButton({ text, onClick }) {
  return (
    <>
       <button className="anglebtn" onClick={onClick}>
        {text}
      </button>
    </>
   
  );
}

export default AngleButton;
