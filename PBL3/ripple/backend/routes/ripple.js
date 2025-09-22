import express from "express";
import rippleController from "../controllers/rippleController.js";
import authenticateToken from "../middlewares/auth.js";

const router = express.Router();
router.use(authenticateToken);

router.get("/friends", rippleController.getFriendsRipple);
router.get("/global", rippleController.getGlobalRipples);
router.post("/create", rippleController.createRipple);
router.post("/respond", rippleController.respondToRipple); //new path added

export default router;
