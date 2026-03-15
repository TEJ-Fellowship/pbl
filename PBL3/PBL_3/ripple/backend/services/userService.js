import User from "../models/User.js";

const searchUsers = async (query, userId) => {
  return User.find({
    username: { $regex: query, $options: "i" },
    _id: { $ne: userId },
  });
};

export default { searchUsers };
