const express = require("express");
const {
  getAllUsersController,
  createUserController,
} = require("../controllers/userController.js");

const router = express.Router();
router.get("/", getAllUsersController);
router.post("/", createUserController);

module.exports = router;
