import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/user.js"
import auth from "./middleware.js"

const router = express.Router()

//for create new User-signUp
router.post("/", async (req, res) => {
  try {
    const { fullname, username, email, password } = req.body

    // basic validation
    if (!fullname || !username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" })
    }

    // check for existing user (by email or username)
    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email or username already in use" })
    }

    // hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // create user
    const newUser = new User({
      fullname,
      username,
      email,
      password: hashedPassword,
    })
    const savedUser = await newUser.save()

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: savedUser._id,
        fullname: savedUser.fullname,
        username: savedUser.username,
        email: savedUser.email,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

//for login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    // check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    // compare password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    // generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET || "supersecretkey", 
      { expiresIn: "500h" }
    )

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("username email");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await User.find({}).populate("polls", {
      question: 1,
      options: 1,
    })

    res.json(users)
  } catch (err) {
    console.error("Error fetching users:", err.message)
    res.status(500).json({ error: "Server error while fetching users" })
  }
})

export default router




