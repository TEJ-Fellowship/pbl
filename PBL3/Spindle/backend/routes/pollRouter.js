import express from "express"
import { getPoll, postPoll } from "../controllers/createPoll.js"


const pollRouter = express.Router()

pollRouter.get('/',getPoll)
pollRouter.post('/',postPoll)

export default pollRouter