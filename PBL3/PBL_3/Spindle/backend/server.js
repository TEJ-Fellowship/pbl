import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import userRouter from "./routes/userRouter.js"
import pollRouter from "./routes/pollRouter.js"
import allpollRoutes from "./routes/allpollRouter.js";
import geminiRouter from "./routes/geminiRouter.js"
import getUser from "./routes/getUserRouter.js"
dotenv.config() 
const app = express()

// middleware
app.use(cors())
app.use(express.json())

// routes
app.use("/api/users", userRouter)
app.use("/api/createPoll",pollRouter)
app.use("/api/allpolls", allpollRoutes);
app.use('/api/gemini',geminiRouter)
app.use('/',getUser)


// connect to DB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err))

// start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(` Server running on port ${PORT}`))
