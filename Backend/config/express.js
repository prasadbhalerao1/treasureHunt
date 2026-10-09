import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "mongo-sanitize";
import cookieParser from "cookie-parser";
import logger from "../utils/logger.js";

const configureExpress = (app) => {
  // Trust Proxy
  app.set("trust proxy", 1);

  // Security
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          "http://localhost:5173",
          "http://localhost:3000",
          ...(process.env.CORS_ORIGINS || "")
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean),
        ];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    }),
  );

  // Body Parsers
  app.use(express.json({ limit: "50kb" }));
  app.use(cookieParser());

  // Rate Limiting (event Wi-Fi is often NAT'd, so key by token where possible)
  const keyByToken = (req) => req.headers.authorization || req.ip;
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyByToken,
  });
  const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: "Too many login attempts. Wait a minute." },
  });
  const answerLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyByToken,
    message: { msg: "Too many answers. Slow down." },
  });
  app.use("/api", limiter);
  app.use("/api/auth/login", loginLimiter);
  app.use("/api/game/answer", answerLimiter);
  app.use("/api/game/submit", answerLimiter);

  // Sanitization
  app.use((req, res, next) => {
    req.body = mongoSanitize(req.body);
    req.query = mongoSanitize(req.query);
    req.params = mongoSanitize(req.params);
    next();
  });

  // Request Logging
  app.use((req, res, next) => {
    logger.http(req);
    next();
  });
};

export default configureExpress;
