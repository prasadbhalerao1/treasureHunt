import express from "express";
import {
  getDashboardStats,
  getTeams,
  createTeam,
  deleteTeam,
  updateTeamPath,
  getLocations,
  updateLocation,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

import { ROLES } from "../config/constants.js";

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get("/stats", getDashboardStats);

// Team Management
router.get("/teams", getTeams);
router.post("/teams", createTeam);
router.delete("/teams/:id", deleteTeam);
router.put("/teams/:id/path", updateTeamPath); // body: { path: [...] }

// Location Management
router.get("/locations", getLocations);
router.put("/locations/:id", updateLocation); // body: { hint, qrSecret }

export default router;
