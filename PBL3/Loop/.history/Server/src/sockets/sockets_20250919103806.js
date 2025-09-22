// src/sockets/sockets.js
import jwt from "jsonwebtoken";
import Room from "../models/Room.js";
import Loop from "../models/Loop.js";

const roomSnapshots = new Map();

export default function