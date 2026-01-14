import express from "express";
import {
  getGameState,
  submitAnswer,
  volunteerVerify,
  scanQR,
  lookupTeam,
} from "../controllers/gameController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Candidate Routes
router.get("/state", protect, getGameState); // Polling endpoint
router.post("/submit", protect, submitAnswer);
router.post("/scan", protect, scanQR);

// Volunteer Routes
router.get("/lookup", protect, authorize("VOLUNTEER", "ADMIN"), lookupTeam);
router.post(
  "/verify",
  protect,
  authorize("VOLUNTEER", "ADMIN"),
  volunteerVerify
);

export default router;
