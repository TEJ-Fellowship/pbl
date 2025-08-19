import React from "react";
import Navbar from "./Navbar";
const Home = () => {
  return( <>
  <button className="mr-15 px-4 py-2 bg-gray-500 text-white rounded" onClick={()=> alert("Button Cliced!")}>Genre</button>
  <p>Home</p>
  </>);
};

export default Home;
