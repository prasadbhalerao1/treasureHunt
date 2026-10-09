import express from "express";
import dotenv from "dotenv";
import dbConnect from "./config/dbConnect.js";
import configureExpress from "./config/express.js";
import logger from "./utils/logger.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure Middleware
configureExpress(app);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  logger.error(err.message, err);
  const status = err.statusCode || 500;
  const msg = err.message || "Internal Server Error";
  res.status(status).json({
    msg,
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

app.get("/", (req, res) => {
  res.send("TraceRoute API Active");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date() });
});

// Helper to start server if running directly
if (process.env.NODE_ENV !== "production") {
  const startServer = async () => {
    try {
      await dbConnect();
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
      });
    } catch (err) {
      logger.error("Database connection failed", err);
      process.exit(1);
    }
  };
  startServer();
}

// Export for Vercel
export default app;
