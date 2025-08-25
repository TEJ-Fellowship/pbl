import express from 'express';
import { getAllDetail } from '../controllers/PropertyController.js';

const router = express.Router();

router.get("/", getAllDetail);

export default router;