import mongoose from "mongoose";

import { ROLES, FINALE_CHALLENGES } from "../config/constants.js";

const TeamSchema = new mongoose.Schema(
  {
    teamId: { type: String, required: true, unique: true, index: true }, // "TM-25"
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // Leader Email
    passwordHash: { type: String, required: true }, // Scrypt hash
    salt: { type: String, required: true }, // Unique salt
    members: [String], // Member names

    role: {
      type: String,
      enum: [ROLES.CANDIDATE, ROLES.ADMIN],
      default: ROLES.CANDIDATE,
    },

    // Finale Challenge Type (Randomized)
    finaleChallenge: {
      type: String,
      enum: Object.values(FINALE_CHALLENGES),
      default: FINALE_CHALLENGES.ALPHA_ASC,
    },

    // Game Path State
    // The path is a sequence of Location IDs.
    // e.g., [0, 5, 12, 3, 8, 15, 1] means:
    // Start at Loc 0.
    // Index 0 (Loc 0): Completed (Start). Show Hint for Loc 5.
    // Index 1 (Loc 5): Scan QR 5 -> Show Hint for Loc 12.
    // ...
    path: [Number],

    // Tracks progress along the path.
    // -1 = Registered, hasn't scanned Start QR yet.
    // 0 = Scanned Start (Loc 0), looking for Path[1].
    // 1 = Found Path[1], looking for Path[2].
    // ...
    // 7 = Completed all levels
    currentLevelIndex: { type: Number, default: -1 },

    // Timestamp when the LAST level was completed
    lastLevelCompletedAt: { type: Date },

    // History of level completion for Timer calculations
    levelHistory: [
      {
        level: { type: Number },
        completedAt: { type: Date },
      },
    ],

    // Inventory
    collectedKeywords: [String],

    // Security
    activeSessions: [String],
  },
  { timestamps: true },
);

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);
