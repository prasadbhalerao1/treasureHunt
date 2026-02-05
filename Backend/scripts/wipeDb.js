import mongoose from "mongoose";
import Team from "../models/Team.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const wipeDb = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Criteria to KEEP:
    // 1. Role is ADMIN
    // 2. Name contains 'red' (case insensitive)
    // 3. Email contains 'red' (case insensitive)
    const keepCriteria = {
      $or: [
        { role: "ADMIN" },
        { name: { $regex: "red", $options: "i" } },
        { email: { $regex: "red", $options: "i" } },
      ],
    };

    // Find who we are keeping first, for logging
    const toKeep = await Team.find(keepCriteria);
    console.log(`Found ${toKeep.length} users to KEEP:`);
    toKeep.forEach((t) =>
      console.log(`- [KEEP] ${t.name} (${t.email}) - ${t.role}`),
    );

    // Delete everyone else
    const deleteResult = await Team.deleteMany({
      $nor: [
        { role: "ADMIN" },
        { name: { $regex: "red", $options: "i" } },
        { email: { $regex: "red", $options: "i" } },
      ],
    });

    console.log(`\nDeleted ${deleteResult.deletedCount} users.`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error wiping DB:", error);
    process.exit(1);
  }
};

wipeDb();
