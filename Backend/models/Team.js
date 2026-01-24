import mongoose from "mongoose";

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
      enum: ["CANDIDATE", "ADMIN"],
      default: "CANDIDATE",
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
    // If currentLevelIndex = 0, they are at Start (Loc 0) and looking for Path[1].
    // If currentLevelIndex = 1, they found Path[1] and are looking for Path[2].
    // Max index depends on path length (e.g., 6 levels + start = 7 locations total in path).
    currentLevelIndex: { type: Number, default: 0 },

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
