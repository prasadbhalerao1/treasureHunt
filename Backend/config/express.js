import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "mongo-sanitize";
import cookieParser from "cookie-parser";
import logger from "../utils/logger.js";

// CORS_ORIGINS is a comma-separated list. Trailing slashes are ignored and a
// "*" matches one hostname label, e.g.
//   https://traceroute-*-myteam.vercel.app  (any deployment of the frontend)
const toMatcher = (entry) => {
  const clean = entry.trim().replace(/\/+$/, "");
  if (!clean.includes("*")) return (o) => o === clean;
  const pattern = clean
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[a-z0-9-]+");
  const re = new RegExp(`^${pattern}$`);
  return (o) => re.test(o);
};

export const buildOriginMatchers = (list) =>
  [
    "http://localhost:5173",
    "http://localhost:3000",
    ...String(list || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  ].map(toMatcher);

const isAllowedOrigin = (origin) =>
  buildOriginMatchers(process.env.CORS_ORIGINS).some((match) => match(origin));

const configureExpress = (app) => {
  // Trust Proxy
  app.set("trust proxy", 1);

  // Security
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        // No Origin header = same-origin, curl or server-to-server: allow.
        // A disallowed origin gets no CORS headers (the browser blocks it)
        // instead of throwing a 500.
        callback(null, !origin || isAllowedOrigin(origin));
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["Retry-After"],
      maxAge: 86400, // cache preflights for a day
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
