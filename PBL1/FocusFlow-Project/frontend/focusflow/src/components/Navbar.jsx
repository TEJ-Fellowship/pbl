import React from "react";
import notification from "../assets/notification.png";
function Navbar() {
  return (
    <>
      <nav>
        <ul>
          <img
            src="https://media.istockphoto.com/id/636379014/photo/hands-forming-a-heart-shape-with-sunset-silhouette.jpg?s=612x612&w=0&k=20&c=CgjWWGEasjgwia2VT7ufXa10azba2HXmUDe96wZG8F0="
            alt="logo"
            width={40}
            height={38}
            style={{ marginLeft: "40px", borderRadius: "10px" }}
          />
          <li>Home</li>
          <li>Services</li>
          <li>Contact Us</li>
          <input
            type="search"
            placeholder=" 🔍︎ Search your Task List Faster..."
          />
          <li class="notification">
            <img src={notification} alt="notification" />
          </li>
        </ul>
      </nav>
    </>
  );
}

export default Navbar;
