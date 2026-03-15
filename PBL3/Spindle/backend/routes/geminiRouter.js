import express from "express"
import { postGemini } from "../controllers/gemini.js"

const geminiRouter = express.Router()

geminiRouter.post("/",postGemini)

export default geminiRouter