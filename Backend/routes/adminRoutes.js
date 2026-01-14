import express from "express";
import { getDashboardStats } from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", protect, authorize("ADMIN"), getDashboardStats);

export default router;
