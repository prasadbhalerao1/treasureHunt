import express from "express";
import {
  getGameState,
  submitAnswer,
  scanQR,
  answerChallenge,
} from "../controllers/gameController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Candidate Routes
router.get("/state", protect, getGameState); // Resumable state (poll on focus)
router.post("/scan", protect, scanQR); // Start QR / open a challenge
router.post("/answer", protect, answerChallenge); // Answer the level's MCQ
router.post("/submit", protect, submitAnswer); // Mega Puzzle

export default router;
