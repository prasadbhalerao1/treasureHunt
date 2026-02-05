import mongoose from "mongoose";
import Team from "../models/Team.js";
import Location from "../models/Location.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const generateFlows = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const teams = await Team.find({ role: "CANDIDATE" }).sort({ teamId: 1 });
    const locations = await Location.find({});

    // Map LocationId -> Name
    const locMap = {};
    locations.forEach((l) => {
      locMap[l.locationId] = l.name;
    });

    let mdContent = "# Team Flows\n\n";

    teams.forEach((team) => {
      const flow = team.path
        .map((locId, idx) => {
          return `location-${locId} (level ${idx})`;
        })
        .join("-> ");

      mdContent += `${team.teamId} : ${flow}\n\n`;
    });

    // Save to repo root or artifacts
    const outputPath = path.join(__dirname, "..", "team_flows.md");
    fs.writeFileSync(outputPath, mdContent);

    console.log(`✅ Generated team_flows.md at ${outputPath}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error generating flows:", error);
    process.exit(1);
  }
};

generateFlows();
