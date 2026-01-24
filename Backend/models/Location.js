import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  locationId: { type: Number, required: true, unique: true }, // 0 to 16
  name: { type: String, required: true }, // e.g. "Location-0"
  hint: { type: String, default: "" },
  qrSecret: { type: String, required: true },
  keyword: { type: String }, // "Keyword-1"
});

export default mongoose.models.Location ||
  mongoose.model("Location", LocationSchema);
