/**
 * TraceRoute - Question Bank Seeding Script
 * Parses the Markdown MCQ set (or a JSON file) into the Question collection.
 *
 * Usage:
 *   npm run seed:questions                         (uses ../computer_networks_placement_mcqs.md)
 *   node scripts/seedQuestions.js path/to/file.md  (Markdown in the same format)
 *   node scripts/seedQuestions.js path/to/file.json (array of question objects)
 *
 * @author Prasad Bhalerao (https://linkedin.com/in/prasadbhalerao)
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Question from "../models/Question.js";
import {
  parseMcqMarkdown,
  validateQuestions,
} from "../utils/questionLogic.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const DEFAULT_FILE = path.join(
  __dirname,
  "../../computer_networks_placement_mcqs.md",
);

const seedQuestions = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  const file = path.resolve(process.argv[2] || DEFAULT_FILE);
  const isDefault = file === path.resolve(DEFAULT_FILE);

  try {
    const raw = fs.readFileSync(file, "utf8");
    const questions = file.endsWith(".json")
      ? JSON.parse(raw).map((q, i) => ({
          difficulty: "MEDIUM",
          section: "General",
          explanation: "",
          ...q,
          questionId: Number.isInteger(q.questionId) ? q.questionId : i + 1,
        }))
      : parseMcqMarkdown(raw);

    // The bundled set must be exactly 60 questions; custom files just need to be valid
    validateQuestions(questions, isDefault ? 60 : undefined);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    await Question.deleteMany({});
    await Question.insertMany(questions);

    const byDiff = questions.reduce((m, q) => {
      m[q.difficulty] = (m[q.difficulty] || 0) + 1;
      return m;
    }, {});
    console.log(`✅ Seeded ${questions.length} questions from ${file}`);
    console.log("   Difficulty split:", byDiff);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding questions:", error.message);
    process.exit(1);
  }
};

seedQuestions();
