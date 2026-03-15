import express from "express";
import authMiddleware from '../middlewares/auth.js'
import userController from '../controllers/userController.js'

const router = express.Router()

router.get('/search', authMiddleware, userController.searchUsers)

export default router

