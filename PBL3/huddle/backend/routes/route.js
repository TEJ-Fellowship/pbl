import express from "express";
import { userNavigate } from "../controllers/controller.js";

const router = express.Router();

router.get("/", userNavigate);

export default router;
