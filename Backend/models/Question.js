import mongoose from "mongoose";
import { DIFFICULTY } from "../config/constants.js";

const QuestionSchema = new mongoose.Schema(
  {
    questionId: { type: Number, required: true, unique: true, index: true },
    prompt: { type: String, required: true },
    options: {
      type: [
        {
          _id: false,
          key: { type: String, required: true }, // "A", "B", ...
          text: { type: String, required: true },
        },
      ],
      validate: (v) => v.length >= 2 && v.length <= 6,
    },
    correctKey: { type: String, required: true },
    explanation: { type: String, default: "" },
    section: { type: String, default: "General" },
    difficulty: {
      type: String,
      enum: Object.values(DIFFICULTY),
      default: DIFFICULTY.MEDIUM,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

QuestionSchema.pre("validate", function () {
  if (this.options && !this.options.some((o) => o.key === this.correctKey)) {
    this.invalidate("correctKey", "correctKey must match one of the options");
  }
});

export default mongoose.models.Question ||
  mongoose.model("Question", QuestionSchema);
