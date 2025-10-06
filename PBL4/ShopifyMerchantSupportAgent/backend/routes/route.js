import express from "express";
import { shopifySupport } from "../controllers/controller.js";

const router = express.Router();

router.get("/", shopifySupport);

export default router;
