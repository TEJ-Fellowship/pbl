import React from "react";
import { Link } from "react-router";
const Navbar = () => {
  return (
    <nav>
      <ul style={{ display: "flex", justifyContent: "space-between" }}>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/create">Create</Link>
        </li>
        <li>
          <Link to="/hero">Go to Hero</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
