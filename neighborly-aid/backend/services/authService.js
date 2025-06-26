const User = require("../models/User.js");
const bcrypt = require("bcryptjs");

const login = async (data) => {
  console.log("login service", data);
  const { email, password, phone } = data;

  try {
    const user = await User.findOne({
      //$or: find user by email or phone or both
      $or: [{ email: email }, { phone: phone }],
    });

    console.log(user);

    if (!user) throw new Error("User not found!");

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      throw new Error("Credentials do not match!!");
    }
    return user;
  } catch (error) {
    console.log("Error during login", error);
    throw error;
  }
};

const register = async (data) => {
  console.log("authservice", data);
  try {
    const { name, password, address, email, phone, role } = data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      password: hashedPassword,
      address,
      email,
      phone,
      role,
    });

    // Modify the user object before saving (optional) This is the advantage of making new instance of user and saving
    // user.roles = ["Super Admin"];
    return await newUser.save();
  } catch (error) {
    console.log("Error during User Registration", error);
    throw error;
  }
};

module.exports = { register, login };
