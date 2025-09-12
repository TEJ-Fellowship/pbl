import express from "express"
import { getPoll, getPollById, postPoll } from "../controllers/createPoll.js"


const pollRouter = express.Router()

pollRouter.get('/',getPoll)
pollRouter.get('/:id',getPollById)

pollRouter.post('/',postPoll)

export default pollRouter