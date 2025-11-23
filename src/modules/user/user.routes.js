import { Router } from "express";
import userController from "./user.controller.js";
import auth from "../../middlewares/auth.js"; 

const router = Router();

// RF001
router.post("/register/fisica", userController.registerUser);
router.post("/register/juridica", userController.registerCompany);

// RF002
router.post("/login", userController.login);

// RF003
router.post("/recover-password", userController.recoverPassword);

// RF004
router.post("/logout", userController.logout);

// RF005 - Protegida por autenticação
router.put("/profile", auth, userController.updateProfile);

// RF006 - Protegida por autenticação
router.get("/profile", auth, userController.getProfile);

export default router;