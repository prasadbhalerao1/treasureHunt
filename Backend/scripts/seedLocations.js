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

    // Existing QR secrets are KEPT so already-printed codes stay valid.
    // Pass --new-secrets to deliberately rotate them (then reprint everything).
    const rotate = process.argv.includes("--new-secrets");
    const existing = await Location.find({}).lean();
    const secretByName = new Map(existing.map((l) => [l.name, l.qrSecret]));

    const keepOrMake = (name, make) =>
      !rotate && secretByName.has(name) ? secretByName.get(name) : make();

    const START_NAME = "Location-0 (Start)";
    const locations = [
      {
        locationId: 0,
        name: START_NAME,
        hint: START_HINT,
        qrSecret: keepOrMake(
          START_NAME,
          () => "START-" + randomBytes(4).toString("hex").toUpperCase(),
        ),
        keyword: "START",
      },
    ];

    LOCATION_DATA.forEach((loc, index) => {
      locations.push({
        locationId: index + 1,
        name: loc.name,
        hint: loc.hint,
        qrSecret: keepOrMake(
          loc.name,
          () =>
            `${loc.shortCode}_${Math.floor(100000 + Math.random() * 900000)}`,
        ),
        keyword: loc.keyword,
      });
    });

    await Location.deleteMany({});
    await Location.insertMany(locations);

    const reused = locations.filter((l) => secretByName.get(l.name) === l.qrSecret).length;
    console.log(`✅ Seeded ${locations.length} locations (incl. Start).`);
    console.log(
      rotate
        ? "   All QR secrets were REGENERATED: reprint every QR code."
        : `   Kept ${reused} existing QR secret(s); ${locations.length - reused} new.`,
    );
    console.log("Run `npm run generate:qr` to rebuild the QR images.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding locations:", error);
    process.exit(1);
  }
};

seedLocations();
