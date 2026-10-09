import jwt from "jsonwebtoken";
import dbConnect from "../config/dbConnect.js";
import Team from "../models/Team.js";
import logger from "../utils/logger.js";

// Verifies the JWT and that its session id (jti) is still in the team's
// activeSessions list. Logging in on a 5th device ejects the oldest session.
export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer")) {
    return res.status(401).json({ msg: "Not authorized, no token" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await dbConnect();
    const live = await Team.exists({
      _id: decoded.id,
      activeSessions: decoded.jti,
    });
    if (!live) {
      return res
        .status(401)
        .json({ msg: "Session expired. Please log in again." });
    }

    req.user = decoded; // { teamId, role, id, jti }
    next();
  } catch (error) {
    logger.error("Token verification failed", error);
    res.status(401).json({ msg: "Not authorized, token failed" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: "User role not authorized" });
    }
    next();
  };
};
