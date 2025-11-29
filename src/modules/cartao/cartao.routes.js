import { Router } from "express";
import cardController from "./cartao.controller.js";
import auth from "../../middlewares/auth.js";

const router = Router();

router.use(auth);

// RF007
router.post("/request", cardController.requestNewCard);

// RF009
router.get("/:cardId", cardController.getCardDetails);

// RF012
router.put("/:cardId/cancel", cardController.cancelCard);

// RF015
router.get("/balances", cardController.getBalances);

// RF016 & RF017
router.get("/:cardId/history", cardController.getUsageHistory);

export default router;