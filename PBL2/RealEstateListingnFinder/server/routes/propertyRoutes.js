import express from 'express';
import { addProperty, getAllProperty } from '../controllers/PropertyController.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.get("/get-all-property", getAllProperty);

router.post("/add-property", upload.array("images", 10), addProperty )

export default router;