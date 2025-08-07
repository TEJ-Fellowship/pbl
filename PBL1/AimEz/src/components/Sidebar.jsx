import React from "react";
import { FaHome } from "react-icons/fa";
import { FaBullseye } from 'react-icons/fa';
import { FaCalendarAlt } from 'react-icons/fa';

function Sidebar({setActiveSection}) {
  return (
    <>
      <div className="sidebar">
        <h2 style={{color:"#5046E4"}}>AimEZ</h2>

        <div className="list">
          <ul>
            <li className='eachList' onClick={()=> setActiveSection("home")}>
              <FaHome />
              
              Home
            </li>
            <li className='eachList' onClick={()=> setActiveSection("goals")}>
              <FaBullseye />
              
              Goals/Categories
            </li>
            
            <li className="eachList" onClick={()=> setActiveSection("calendar")}><FaCalendarAlt />
           Calender</li>

          </ul>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
