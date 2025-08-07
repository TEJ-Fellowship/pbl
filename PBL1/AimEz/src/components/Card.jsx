import React from 'react'
import "../card.css";
import { FaPlus } from "react-icons/fa";
import GoalForm from './GoalForm';


function Card(props) {
  return (
    <div className='card'>

    <div className='card-header'>
    <h6>{props.heading}</h6>
    <FaPlus className="plus-icon" onClick={props.onPlusClick}/>
    </div>

    <img src={props.source} className='card-image'/>
      
    </div>
  )
}

export default Card