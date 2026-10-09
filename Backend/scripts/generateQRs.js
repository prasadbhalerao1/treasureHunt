import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Target: Frontend/public/qr_codes
// Backend/scripts -> Backend -> Parent -> Frontend -> public -> qr_codes
const outputDir = path.join(
  __dirname,
  "..",
  "..",
  "Frontend",
  "public",
  "qr_codes",
);

import mongoose from "mongoose";
import Location from "../models/Location.js";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env") });

const generateQRs = async () => {
  if (fs.existsSync(outputDir)) {
    console.log(`Cleaning existing QR codes in: ${outputDir}`);
    fs.rmSync(outputDir, { recursive: true, force: true });
  }

  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Generating QR codes in: ${outputDir}`);

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI missing");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const locations = await Location.find({}).sort({ locationId: 1 });

    for (const loc of locations) {
      // Sanitize the location name:
      // 1. Replace " - " with "_"
      // 2. Replace spaces with "_"
      // 3. Remove characters that aren't letters, numbers, underscores, or hyphens
      const sanitized = loc.name
        .replace(/\s-\s/g, "_")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_\-]/g, "");

      // "00_Location-0_Start.png", "01_Bus_Parking....png": sorted by location ID
      const fileName = `${String(loc.locationId).padStart(2, "0")}_${sanitized}.png`;
      await QRCode.toFile(path.join(outputDir, fileName), loc.qrSecret, {
        width: 600,
        margin: 4, // quiet zone keeps it scannable when printed small
        errorCorrectionLevel: "M",
      });
      console.log(`Generated ${fileName} (Secret: ${loc.qrSecret})`);
    }

    console.log("✅ All QR codes generated from Database.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

generateQRs();
