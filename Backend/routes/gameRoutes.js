import express from "express";
import {
  getGameState,
  submitAnswer,
  scanQR,
} from "../controllers/gameController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Candidate Routes
router.get("/state", protect, getGameState); // Polling endpoint
router.post("/submit", protect, submitAnswer);
router.post("/scan", protect, scanQR);

export default router;
