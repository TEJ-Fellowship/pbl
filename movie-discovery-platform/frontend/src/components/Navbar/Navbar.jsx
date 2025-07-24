// src/components/Navbar/Navbar.jsx

import { Link } from "react-router-dom";
import "./Navbar.css";
import navbarData from "./navbardata";

const Navbar = () => {
  const { navbarLinks, navbarTitle, navbarImage } = navbarData;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src={navbarImage} alt="Logo" className="navbar-logo" />
          <h4 className="navbar-title" id="navbar-title-text">
            {navbarTitle}
          </h4>
        </Link>

        <button
          className="navbar-toggler"
          id="navbar-mobileview-btn"
          type="button"
          aria-label="Toggle navigation"
          onClick={() =>
            document
              .getElementById("navbarSupportedContent")
              .classList.toggle("show")
          }
        >
          &#9776;
        </button>

        <div className="navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav">
            {navbarLinks.map((link, index) => (
              <li className="nav-item" key={index}>
                <Link to={link.url} className="nav-link">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
