// src/sockets/sockets.js
import jwt from "jsonwebtoken";
import Room from "../models/Room.js";
import Loop from "../models/Loop.js";

const roomSnapshots = new Map();

export default function initSockets(io) {
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // Attempt auth if token present in handshake query
        cons
    })
}