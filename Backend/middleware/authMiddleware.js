import jwt from "jsonwebtoken";
import dbConnect from "../config/dbConnect.js";
import Team from "../models/Team.js";

export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verify Session Logic - STRICT MODE for Production
      // We check if the JTI is still in the user's activeSessions
      const team = await Team.findById(decoded.id).select(
        "activeSessions role"
      );

      if (!team) {
        return res.status(401).json({ msg: "User not found" });
      }

      if (!team.activeSessions.includes(decoded.jti)) {
        return res
          .status(401)
          .json({
            msg: "Session expired or invalidated (Max devices reached)",
          });
      }

      req.user = decoded; // { teamId, role, id, jti }
      // Update role from DB to ensure it's fresh? (Optional, but good for security)
      req.user.role = team.role;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ msg: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ msg: "Not authorized, no token" });
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
