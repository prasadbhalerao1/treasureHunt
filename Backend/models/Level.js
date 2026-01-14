import mongoose from "mongoose";

const LevelSchema = new mongoose.Schema({
  levelNumber: { type: Number, required: true, unique: true },
  hintText: { type: String, required: true },
  imgUrl: { type: String }, // Optional image for hint
  acceptedAnswers: [{ type: String }], // Array of valid answers to unlock location
  locationName: { type: String, required: true },
  qrSecret: { type: String, required: true }, // Verified against QR scan
  keyword: { type: String }, // Reward for completing level
});

export default mongoose.models.Level || mongoose.model("Level", LevelSchema);
