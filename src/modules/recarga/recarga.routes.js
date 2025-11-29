import { Router } from "express";
import rechargeController from "./recarga.controller.js";
import auth from "../../middlewares/auth.js";

const router = Router();

router.use(auth);

// RF020
router.post("/", rechargeController.rechargeCard);

export default router;