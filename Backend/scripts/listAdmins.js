import mongoose from "mongoose";
import Team from "../models/Team.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const listAdmins = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const admins = await Team.find({ role: "ADMIN" });
    console.log("Admins found:", admins.length);
    admins.forEach((admin) => {
      console.log(JSON.stringify(admin, null, 2));
    });

    // Also list anyone with "red" in their name or email, just in case
    const reds = await Team.find({
      $or: [
        { name: { $regex: "red", $options: "i" } },
        { email: { $regex: "red", $options: "i" } },
      ],
    });
    console.log("\nUsers with 'red' in name/email:", reds.length);
    reds.forEach((u) => {
      console.log(
        `- ID: ${u._id}, TeamID: ${u.teamId}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`,
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error listing admins:", error);
    process.exit(1);
  }
};

listAdmins();
