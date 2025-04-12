import express from "express";
import signupController from "../controllers/signupController.js";
import loginController from "../controllers/loginController.js";
import authUser from "../middleware/authUser.js";
import logoutController from "../controllers/logoutController.js";

const router = express.Router();

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/logout", logoutController);
router.get("/verify", authUser);

export default router;
