const User = require("../models/User.js");

const getAllUsers = async () => {
  try {
    console.log("UserService: getAllUsers");
    const userList = await User.find({});
    console.log("userList", userList);
    return userList;
  } catch (error) {
    console.log("Error fetching users", error);
    throw error;
  }
};

const createUser = async (data) => {
  try {
    const user = await User.create(data);
    return user;
  } catch (error) {
    console.log("Error creating user", error);
    throw error;
  }
};

const getUserDashboard = async (userId) => {
  try {
    const user = await User.findById(userId);
    console.log("user in service", user);
    return user;
  } catch (error) {
    console.log("Error fetching user dashboard", error);
    throw error;
  }
};

module.exports = {
  getAllUsers,
  createUser,
  getUserDashboard,
};
