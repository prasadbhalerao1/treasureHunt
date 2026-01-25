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
          "https://treasurehunt-gotham-ai.vercel.app",
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

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300000,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      if (req.headers.authorization) return req.headers.authorization;
      if (req.body && req.body.teamId) return req.body.teamId;
      return req.ip;
    },
  });
  app.use("/api", limiter);

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
