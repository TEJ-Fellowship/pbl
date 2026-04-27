const express = require("express");
const { getHealth, handleRagSearch } = require("../controllers/rag.controller");

const ragRouter = express.Router();

ragRouter.get("/", getHealth);
ragRouter.post("/search", handleRagSearch);

module.exports = ragRouter;
