import express from "express"
import { fetchUser } from "../controllers/getUser.js"

const getUser = express.Router()

getUser.get('/api/poll/:pollId/option/:optionId/voters',fetchUser)

export default getUser