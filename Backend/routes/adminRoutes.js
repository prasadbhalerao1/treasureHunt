import express from "express";
import {
  getDashboardStats,
  getTeams,
  createTeam,
  deleteTeam,
  updateTeamPath,
  getTeamChallenges,
  reshuffleTeamQuestions,
  resetTeam,
  unlockTeamLevel,
  forceCompleteLevel,
  exportResults,
  getLocations,
  createLocation,
  updateLocation,
  regenerateLocationSecret,
  deleteLocation,
  getAdminSettings,
  updateSettings,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  exportQuestions,
  sendBroadcast,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get("/stats", getDashboardStats);
router.get("/results.csv", exportResults);

// Settings
router.get("/settings", getAdminSettings);
router.put("/settings", updateSettings);

// Team Management
router.get("/teams", getTeams);
router.post("/teams", createTeam);
router.delete("/teams/:id", deleteTeam);
router.put("/teams/:id/path", updateTeamPath); // body: { path: [...] }
router.get("/teams/:id/challenges", getTeamChallenges);
router.post("/teams/:id/reshuffle", reshuffleTeamQuestions);
router.post("/teams/:id/reset", resetTeam);
router.post("/teams/:id/unlock", unlockTeamLevel);
router.post("/teams/:id/force-complete", forceCompleteLevel);

// Location Management
router.get("/locations", getLocations);
router.post("/locations", createLocation);
router.put("/locations/:id", updateLocation); // body: { hint, qrSecret, name, keyword }
router.post("/locations/:id/regenerate-secret", regenerateLocationSecret);
router.delete("/locations/:id", deleteLocation);

// Broadcast email. body: { subject, body, mode: "TEST"|"ALL", confirm }
router.post("/broadcast", sendBroadcast);

// Question Bank
router.get("/questions", getQuestions);
router.get("/questions/export", exportQuestions);
router.post("/questions/import", importQuestions);
router.post("/questions", createQuestion);
router.put("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);

export default router;
