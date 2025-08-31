// controllers/users.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

// --- Signup ---
export const signupUser = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    if (!fullname || !email || !password) return res.status(400).json({ error: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ fullname, email, passwordHash });
    await user.save();

    const token = signToken(user);
    res.status(201).json({ message: "Signup successful", token, user: { id: user._id, fullname, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Login ---
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: "Invalid email or password" });

    const token = signToken(user);
    res.json({ message: "Login successful", token, user: { id: user._id, fullname: user.fullname, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
