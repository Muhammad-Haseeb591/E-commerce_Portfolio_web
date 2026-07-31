const jwt = require("jsonwebtoken");
const User = require("../models/User");

const TOKEN_COOKIE_NAME = "token";


exports.protect = async (req, res, next) => {
  const token =
    req.cookies?.[TOKEN_COOKIE_NAME] ||
    req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
    }

    req.userId = user._id;
    req.user = user;
    return next();
  } catch (error) {
    // Distinguish between an expired token and a genuinely invalid one —
    // helps the frontend decide whether to silently refresh vs force
    // a full re-login, and makes debugging auth issues much faster.
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired, please log in again",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission.",
      });
    }
    return next();
  };
};