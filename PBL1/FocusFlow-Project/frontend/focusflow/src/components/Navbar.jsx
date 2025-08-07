import React from "react";
import notification from "../assets/notification.svg";
import logo from "../assets/logo.png";
import searchIcon from "../assets/search.png";

function Navbar() {
  return (
    <>
      <nav id="mynav">
        <div className="navbar-container">
          <ul className="nav-left">
            <a href="#">
              <img src={logo} alt="logo" className="navbar-logo" />
            </a>
            <li>
              <a href="#" style={{ textDecoration: "none", color: "#333333" }}>
                Home
              </a>
            </li>
            <li>
              <a
                href="#newtask"
                style={{ textDecoration: "none", color: "#333333" }}
              >
                Add New Task
              </a>
            </li>
            <li>
              <a
                href="#mytask"
                style={{ textDecoration: "none", color: "#333333" }}
              >
                Your Task
              </a>
            </li>
            <li>
              <a
                href="#overview"
                style={{ textDecoration: "none", color: "#333333" }}
              >
                Overview
              </a>
            </li>
            <li>
              <a
                href="#gemini"
                style={{ textDecoration: "none", color: "#333333" }}
              >
                Gemini
              </a>
            </li>
          </ul>

          <ul className="nav-right">
            <div className="search-container">
              <img src={searchIcon} alt="search" className="search-icon" />
              <input type="text" placeholder="Search..." />
            </div>
            <li className="notification">
              <img src={notification} alt="notification" />
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
