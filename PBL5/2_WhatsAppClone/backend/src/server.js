import express from "express";
import { createServer } from "http";

const app = express();
app.use(express.json());

const httpServer = createServer(app);

httpServer.listen(3000, () => console.log("Node server running...."));
