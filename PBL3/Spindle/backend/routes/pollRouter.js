import express from "express"
import { deletePoll, getPoll, getPollById, postPoll } from "../controllers/createPoll.js"


const pollRouter = express.Router()

pollRouter.get('/',getPoll)
pollRouter.get('/:id',getPollById)
pollRouter.post('/',postPoll)
pollRouter.delete('/:id',deletePoll)


export default pollRouter