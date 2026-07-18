const router = require("express").Router();
const passport = require("passport");
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  generateToken,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.Middleware");
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${CLIENT_URL}/login?error=google` }),
  (req, res) => {
    const token = generateToken(req.user._id);
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const redirectTo = req.query.state ? decodeURIComponent(req.query.state) : "/";
    res.redirect(`${CLIENT_URL}${redirectTo}`);
  }
);

// Email/password auth
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

// Forgot / Reset password
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

module.exports = router;