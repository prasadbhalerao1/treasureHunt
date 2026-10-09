import mongoose from "mongoose";
import {
  DEFAULT_SETTINGS,
  EVENT_STATUS,
  OUT_OF_ATTEMPTS,
} from "../config/constants.js";

// Single-document collection (key = "main")
const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    eventName: { type: String, default: DEFAULT_SETTINGS.eventName },
    tagline: { type: String, default: DEFAULT_SETTINGS.tagline },
    totalLevels: { type: Number, default: DEFAULT_SETTINGS.totalLevels },
    maxAttemptsPerQuestion: {
      type: Number,
      default: DEFAULT_SETTINGS.maxAttemptsPerQuestion,
    },
    wrongAnswerCooldownSeconds: {
      type: Number,
      default: DEFAULT_SETTINGS.wrongAnswerCooldownSeconds,
    },
    wrongAnswerTimePenaltySeconds: {
      type: Number,
      default: DEFAULT_SETTINGS.wrongAnswerTimePenaltySeconds,
    },
    outOfAttemptsAction: {
      type: String,
      enum: Object.values(OUT_OF_ATTEMPTS),
      default: DEFAULT_SETTINGS.outOfAttemptsAction,
    },
    eventStatus: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: DEFAULT_SETTINGS.eventStatus,
    },
    showLeaderboardToTeams: {
      type: Boolean,
      default: DEFAULT_SETTINGS.showLeaderboardToTeams,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Settings ||
  mongoose.model("Settings", SettingsSchema);
