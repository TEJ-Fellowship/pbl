import React from "react";
import notification from "../assets/notification.svg";
import logo from "../assets/logo.png";
import searchIcon from "../assets/search.png";

function Navbar() {
  return (
    <>
      <nav>
        <div className="navbar-container">
          <ul className = 'nav-left'>

            <img src= {logo} alt="logo" className="navbar-logo" />
            <li>Home</li>
            <li>Services</li>
            <li>Contact Us</li>
          </ul>

          <ul className="nav-right">
            <div className="search-container">
              <img src={searchIcon} alt="search" className="search-icon" />
            <input
              type="text" placeholder="Search..." />
            </div>
            <li class="notification">
              <img src={notification} alt="notification" />
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
