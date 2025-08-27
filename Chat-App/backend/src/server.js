// const express = require("express");
// const dotenv = require("dotenv");

//instead of doing that , let's do this
//but first do 'type': 'module'; in package.json
import express from "express";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

const app = express();

//testing

app.get("/", (req, res) => {
  res.send("Hello Chat Application ");
});

// console.log("mongo uri:", ENV.MONGO_URI);
app.listen(ENV.PORT, () => {
  console.log("server started on port", ENV.PORT)
  connectDB()
    }
);
