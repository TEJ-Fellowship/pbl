const express = require("express");
const {
  getAllUsersController,
  createUserController,
  getUserDashboardController,
} = require("../controllers/userController.js");

const router = express.Router();
router.get("/", getAllUsersController);
router.get("/:userId", getUserDashboardController);
router.post("/", createUserController);

module.exports = router;
