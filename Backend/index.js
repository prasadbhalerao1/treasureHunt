import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "mongo-sanitize";
import cookieParser from "cookie-parser";

// Routes
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dbConnect from "./config/dbConnect.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for Vercel/proxies
app.set("trust proxy", 1);

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://treasurehunt-gotham-ai.vercel.app",
      ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" })); // Body limit
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50000, // Extremely high limit (effectively disabled for humans)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // 1. If user is logged in (Bearer Token), use that
    if (req.headers.authorization) {
      return req.headers.authorization;
    }
    // 2. If trying to login/register, use the Team ID or Email if provided to throttle specific accounts
    if (req.body && req.body.teamId) {
      return req.body.teamId;
    }
    // 3. Fallback to IP for anonymous traffic (e.g. landing page)
    return req.ip;
  },
});
app.use("/api", limiter);

// Sanitize inputs (NoSQL Injection)
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});

// REQUEST LOGGER
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`
  );
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/admin", adminRoutes);

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);
  const status = err.statusCode || 500;
  const msg = err.message || "Internal Server Error";
  res.status(status).json({
    msg,
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

app.get("/", (req, res) => {
  res.send("Campus Heist API Active");
});

// Helper to start server if running directly
if (process.env.NODE_ENV !== "production") {
  const startServer = async () => {
    try {
      await dbConnect();
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (err) {
      console.error("Database connection failed", err);
      process.exit(1);
    }
  };
  startServer();
}

// Export for Vercel
export default app;