import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
    teamId: { type: String, required: true, unique: true, index: true }, // "TM-A1B2"
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // Leader Email
    passwordHash: { type: String, required: true }, // Scrypt hash
    salt: { type: String, required: true }, // Unique salt
    members: [{ type: String }], // Member names

    // Role - Restored for Authorization checks
    role: {
      type: String,
      enum: ["CANDIDATE", "VOLUNTEER", "ADMIN"],
      default: "CANDIDATE",
    },

    // Game State
    currentLevel: { type: Number, default: 1, index: true },

    // Level Status Map
    // Key = Level Number (String), Value = Object
    levelStatus: {
      type: Map,
      of: new mongoose.Schema(
        {
          status: {
            type: String,
            enum: [
              "LOCKED",
              "HINT_UNLOCKED",
              "LOCATION_REVEALED",
              "AWAITING_QR",
              "COMPLETED",
            ],
            default: "HINT_UNLOCKED",
          },
          // verified: { type: Boolean, default: false }, // REMOVED
          // volunteerVerifiedAt: { type: Date }, // REMOVED
          completedAt: { type: Date },
        },
        { _id: false }
      ),
      default: {},
    },

    // Inventory
    collectedKeywords: [{ type: String }],

    // Security
    activeSessions: [{ type: String }], // Array of JTI tokens (Max 5)
    resetPasswordOtp: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// Compound Index for Volunteer Dashboard - REMOVED
// TeamSchema.index({ currentLevel: 1, teamId: 1 });

// Ensure levelStatus is initialized for Level 1
TeamSchema.pre("save", function (next) {
  if (this.isNew && !this.levelStatus.has("1")) {
    this.levelStatus.set("1", {
      status: "HINT_UNLOCKED",
      // verified: false,
    });
  }
  next();
});

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);
