import express from "express";
import {
  addProperty,
  deleteProperty,
  getAllProperty,
  updateProperty,
} from "../controllers/PropertyController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.get("/get-all-property", getAllProperty);

// Upload up to 10 images per property
router.post("/add-property", upload.array("images", 10), addProperty);

router.put("/edit-property/:id", upload.array("images", 10), updateProperty);

router.delete("/delete-property/:id", deleteProperty);

export default router;
