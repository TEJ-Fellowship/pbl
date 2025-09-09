import express from "express";
import contactController from "../controllers/contactController.js";

import authenticateToken from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/contacts/add", contactController.addContact);
router.get("/contact/list", contactController.listContacts);
router.delete("/contact/remove/:contactId", contactController.removeContact);

export default router;
