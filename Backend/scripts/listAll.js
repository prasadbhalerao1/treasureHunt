import mongoose from "mongoose";
import Team from "../models/Team.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const listAll = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const teams = await Team.find({}, "name email teamId role");
    console.log("--- START LIST ---");
    teams.forEach((t) =>
      console.log(`${t.teamId} | ${t.name} | ${t.email} | ${t.role}`),
    );
    console.log("--- END LIST ---");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

listAll();
