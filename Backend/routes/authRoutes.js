import express from "express";
import { login } from "../controllers/authController.js";

const router = express.Router();

// Public Registration REMOVED
// router.post("/register", register);

router.post("/login", login);

export default router;
