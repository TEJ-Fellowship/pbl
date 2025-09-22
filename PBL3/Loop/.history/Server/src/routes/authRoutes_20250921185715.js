// Fixed controllers/authController.js - Consistent user response structure
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// Signup
export const signup = async (req, res) => {
  const { username, email, password } = req.body;
  
  // Input validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      } else {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    const user = await User.create({ username, email, password });
    
    // FIXED: Consistent user response structure
    res.status(201).json({
      id: user._id,           // Add id field
      _id: user._id,          // Keep _id field
      username: user.username,
      email: user.email,
      name: user.username,    // Add name field for consistency
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
};

// Login
export const login = async (req, res) => {
  const { email, password } = req.body;
  
  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // FIXED: Consistent user response structure
    res.json({
      id: user._id,           // Add id field
      _id: user._id,          // Keep _id field
      username: user.username,
      email: user.email,
      name: user.username,    // Add name field for consistency
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};// Fixed controllers/authController.js - Consistent user response structure
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// Signup
export const signup = async (req, res) => {
  const { username, email, password } = req.body;
  
  // Input validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      } else {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    const user = await User.create({ username, email, password });
    
    // FIXED: Consistent user response structure
    res.status(201).json({
      id: user._id,           // Add id field
      _id: user._id,          // Keep _id field
      username: user.username,
      email: user.email,
      name: user.username,    // Add name field for consistency
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
};

// Login
export const login = async (req, res) => {
  const { email, password } = req.body;
  
  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // FIXED: Consistent user response structure
    res.json({
      id: user._id,           // Add id field
      _id: user._id,          // Keep _id field
      username: user.username,
      email: user.email,
      name: user.username,    // Add name field for consistency
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};