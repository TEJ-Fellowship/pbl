import React from "react";
import { Link } from "react-router";
import { Trash } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const Home = ({ notes, handleDelete }) => {
  return (
    <>
      <div className="container" style={{ display: "flex" }}>
        {notes.map((note, index) => (
          <div
            className="container"
            style={{
              border: "1px solid red",
              borderRadius: "5px",
              margin: "5px",
            }}
            key={index}
          >
            <h5>{note.title}</h5>
            <span>
              <p>{note.content} </p>
            </span>
            <Trash onClick={(e) => handleDelete(e, note._id)} />
          </div>
        ))}
      </div>
    </>
  );
};

export default Home;
