import mongoose from "mongoose";
import Location from "../models/Location.js";
import dotenv from "dotenv";
import { randomBytes } from "node:crypto";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    const locations = [];

    // Location 0 (Start)
    locations.push({
      locationId: 0,
      name: "Location-0 (Start)",
      hint: "Go to the Starting Point.",
      qrSecret: "START-" + randomBytes(4).toString("hex").toUpperCase(),
      keyword: "START", // Optional
    });

    const locationData = [
      {
        name: "Bus Parking (Behind Cafeteria)",
        shortCode: "BUSPARK",
        hint: "Not a classroom, not a hall Big yellow giants stand tall. Meals are near, engines sleep, Find your clue where drivers meet.",
        keyword: "BERLIN",
      },
      {
        name: "Food Court – Dosa Wala",
        shortCode: "DOSA",
        hint: "A common ground for every branch,\nwhere hunger makes alliances.\nFrom there, track fermentation’s reward,\nserved flat, folded, and warm.",
        keyword: "BOGOTA",
      },
      {
        name: "Cafeteria",
        shortCode: "CAFE",
        hint: "Where hunger gathers between bells,\nplates move fast, and chatter swells.\nMeals replace the morning grind—\nsearch where students queue to dine.",
        keyword: "DENVER",
      },
      {
        name: "Jaywant Library",
        shortCode: "LIBRARY",
        hint: "Victory’s temple holds the scrolls,\nwhere whispers die and silence patrols.\nThe guardian named for triumph’s call—\nknowledge sleeps behind these walls.",
        keyword: "HELSINKI",
      },
      {
        name: "CSBS Department",
        shortCode: "CSBS",
        hint: "Not only programmers, not only managers — this is where tech meets business.",
        keyword: "LISBON",
      },
      {
        name: "FY Department",
        shortCode: "FY",
        hint: "Where rookies shed their school-day skin,\nengineers take first steps within.\nBeginnings live on every page—\nthe launchpad of the college stage.",
        keyword: "MARSEILLE",
      },
      {
        name: "Physics Lab",
        shortCode: "PHYLAB",
        hint: "Where pendulums swing and circuits glow,\nbeneath the stage where speakers show.\nForces meet and laws collide—\nNewton whispers, Ohm replies.",
        keyword: "MOSCOW",
      },
      {
        name: "Stationery Store (Food Court)",
        shortCode: "STATIONERY",
        hint: "Among the edible, find what’s not—\nink and paper, bound and bought.\nWhere mistakes retreat with grace,\nand answers get a cleaner face.",
        keyword: "NAIROBI",
      },
      {
        name: "Xerox Shop",
        shortCode: "XEROX",
        hint: "Where singularity becomes a crowd,\nfaded notes grow crisp and loud.\nOne idea enters, multiplied—\nclarity printed side by side.",
        keyword: "PROFESSOR",
      },
      {
        name: "Mac Lab",
        shortCode: "MACLAB",
        hint: "🍎 ➡️ 💻 ➡️ 🚪\nSilver screens in silent rows,\nwhere designs and deadlines go.\nMouse and keys work side by side,\nyour next answer waits inside.",
        keyword: "RIO",
      },
      {
        name: "Counselling Centre",
        shortCode: "COUNSEL",
        hint: "A strong mind wins every heist. When fear rises, climb the steps. Behind the door where hearts heal, your next secret waits.",
        keyword: "STOCKHOLM",
      },
      {
        name: "Student Section",
        shortCode: "STUDENT",
        hint: "Where dreams queue up in paper form,\nand patience beats the brightest norm.\nNo classes here, just forms to sign—\nwhere student requests wait in line.",
        keyword: "TOKYO",
      },
    ];

    locationData.forEach((loc, index) => {
      const i = index + 1;
      // Format: SHORTCODE_RANDOMNUM (e.g., PHYLAB_839210)
      const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digit number
      const secret = `${loc.shortCode}_${randomNum}`;

      locations.push({
        locationId: i,
        name: loc.name,
        hint: loc.hint,
        qrSecret: secret,
        keyword: loc.keyword,
      });
    });

    await Location.insertMany(locations);
    console.log(`✅ Seeded ${locations.length} locations.`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding locations:", error);
    process.exit(1);
  }
};

seedLocations();
