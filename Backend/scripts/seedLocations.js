/**
 * TraceRoute - Location Seeding Script
 * Creates the Start location + 12 campus checkpoints with fresh QR secrets.
 * Hints are shown to a team after they solve the previous level's challenge.
 *
 * Usage: npm run seed:locations
 *
 * @author Prasad Bhalerao (https://linkedin.com/in/prasadbhalerao)
 */
import mongoose from "mongoose";
import Location from "../models/Location.js";
import dotenv from "dotenv";
import { randomBytes } from "node:crypto";
import { LOCATION_DATA, START_HINT } from "../data/locations.js";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedLocations = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    await Location.deleteMany({});
    console.log("Cleared existing locations.");

    const locations = [
      {
        locationId: 0,
        name: "Location-0 (Start)",
        hint: START_HINT,
        qrSecret: "START-" + randomBytes(4).toString("hex").toUpperCase(),
        keyword: "START",
      },
    ];

    LOCATION_DATA.forEach((loc, index) => {
      const secretNumber = Math.floor(100000 + Math.random() * 900000);
      locations.push({
        locationId: index + 1,
        name: loc.name,
        hint: loc.hint,
        qrSecret: `${loc.shortCode}_${secretNumber}`,
        keyword: loc.keyword,
      });
    });

    await Location.insertMany(locations);
    console.log(`✅ Seeded ${locations.length} locations (incl. Start).`);
    console.log("Run `npm run generate:qr` to build the printable QR codes.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding locations:", error);
    process.exit(1);
  }
};

seedLocations();
