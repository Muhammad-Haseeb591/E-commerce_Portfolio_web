const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendOtpEmail, sendResetPasswordEmail } = require("../services/sendemail.services");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

/**
 * Generates a signed JWT containing the user's id.
 * @param {string} id - MongoDB user _id
 * @returns {string} signed JWT (expires in 7 days)
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * Issues a JWT, sets it as an httpOnly cookie, and returns the user payload.
 * Also returns the token in the response body for Bearer-auth clients (mobile/Postman).
 * @param {object} user - Mongoose user document
 * @param {object} res - Express response object
 * @param {number} [statusCode=200]
 */
const sendToken = (user, res, statusCode = 200) => {
  const token = generateToken(user._id);
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(statusCode).json({
    success: true,
    message: "You're logged in!",
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
};

/**
 * POST /register
 * Creates a new unverified user and sends an OTP for email verification.
 * If an unverified account with the same email exists, it is updated and a new OTP is sent.
 */
exports.register = async (req, res) => {
  try {
    let { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
        message: "Please fill in your name, email, and password.",
      });
    }

    email = email.toLowerCase().trim();

    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.isVerified) {
        return res.status(400).json({
          success: false,
          code: "EMAIL_ALREADY_EXISTS",
          message: "This email is already registered.",
        });
      }

      existing.fullName = fullName;
      existing.password = password;
      const otp = existing.generateOtp();
      await existing.save();

      sendOtpEmail(existing.email, otp)
        .then(() => console.log(`[Register] OTP email accepted by SMTP for: ${existing.email}`))
        .catch((err) => console.error(`[Register] OTP email failed for existing user (${existing.email}):`, err));

      return res.status(200).json({
        success: true,
        code: "UNVERIFIED_ACCOUNT_UPDATED",
        message: "This email is registered but not verified yet. We've sent a new OTP to your inbox.",
        email: existing.email,
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
    });

    const otp = user.generateOtp();
    await user.save();

    sendOtpEmail(user.email, otp)
      .then(() => console.log(`[Register] OTP email accepted by SMTP for: ${user.email}`))
      .catch((err) => console.error(`[Register] OTP email failed for new user (${user.email}):`, err));

    return res.status(201).json({
      success: true,
      code: "REGISTERED_PENDING_VERIFICATION",
      message: "You're almost done! We've sent an OTP to your email — please verify to finish signing up.",
      email: user.email,
    });

  } catch (error) {
    console.error("[Register] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
};

/**
 * POST /verify-otp
 * Verifies the OTP sent during registration/resend, activates the account, and logs the user in.
 */
exports.verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
        message: "Please enter your email and the OTP.",
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email }).select("+otp +otpExpiry");

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "We couldn't find an account with this email.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        code: "ALREADY_VERIFIED",
        message: "This email is already verified.",
      });
    }

    const isValid = user.verifyOtp(otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        code: "OTP_INVALID_OR_EXPIRED",
        message: "This OTP is incorrect or has expired. Please request a new one.",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    sendToken(user, res);

  } catch (error) {
    console.error("[VerifyOtp] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
};

/**
 * POST /resend-otp
 * Generates and sends a fresh OTP to an unverified account.
 */
exports.resendOtp = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
        message: "Please enter your email.",
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "We couldn't find an account with this email.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        code: "ALREADY_VERIFIED",
        message: "This email is already verified.",
      });
    }

    const otp = user.generateOtp();
    await user.save();

    sendOtpEmail(user.email, otp)
      .then(() => console.log(`[ResendOtp] OTP email accepted by SMTP for: ${user.email}`))
      .catch((err) => console.error(`[ResendOtp] OTP email failed for ${user.email}:`, err));

    return res.status(200).json({
      success: true,
      code: "OTP_RESENT",
      message: "We've sent a new OTP to your email.",
    });

  } catch (error) {
    console.error("[ResendOtp] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
};

/**
 * POST /login
 * Authenticates a user with email + password and issues a JWT on success.
 */
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
        message: "Please enter your email and password.",
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Incorrect email or password.",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        code: "GOOGLE_ACCOUNT_ONLY",
        message: "This account uses Google Sign-In. Please continue with Google instead.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Incorrect email or password.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email first using the OTP we sent you.",
        email: user.email,
      });
    }

    sendToken(user, res);

  } catch (error) {
    console.error("[Login] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
};

/**
 * POST /logout
 * Clears the auth cookie.
 */
exports.logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  return res.status(200).json({
    success: true,
    code: "LOGGED_OUT",
    message: "You've been logged out.",
  });
};

/**
 * POST /forgot-password
 * Sends a password reset link to the user's email if the account exists.
 * Always returns a generic success message (even if the email doesn't exist) to prevent user enumeration.
 */
exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
        message: "Please enter your email.",
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user) {
      // Intentionally generic — do not reveal whether the email exists (prevents enumeration)
      return res.status(200).json({
        success: true,
        code: "RESET_LINK_SENT_IF_EXISTS",
        message: "If this email is registered, we've sent a password reset link.",
      });
    }

    const resetToken = user.generateResetToken();
    await user.save();

    const resetUrl = `${CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendResetPasswordEmail(user.email, resetUrl);
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      console.error(`[ForgotPassword] Failed to send reset email to ${user.email}:`, emailError);

      return res.status(500).json({
        success: false,
        code: "RESET_EMAIL_FAILED",
        message: "We couldn't send the reset email. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      code: "RESET_LINK_SENT_IF_EXISTS",
      message: "If this email is registered, we've sent a password reset link.",
    });

  } catch (error) {
    console.error("[ForgotPassword] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
};

/**
 * POST /reset-password/:token
 * Resets a user's password using the token issued via the reset-password email link.
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
        message: "Please enter a new password.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpiry");

    if (!user) {
      return res.status(400).json({
        success: false,
        code: "RESET_TOKEN_INVALID_OR_EXPIRED",
        message: "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      code: "PASSWORD_RESET_SUCCESS",
      message: "Your password has been reset. You can now log in.",
    });

  } catch (error) {
    console.error("[ResetPassword] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
};

/**
 * GET /me
 * Returns the currently authenticated user's profile (requires auth middleware to set req.userId).
 */
exports.getMe = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Please log in to continue.",
      });
    }

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "We couldn't find your account.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("[GetMe] Unexpected error:", error);

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
};

exports.generateToken = generateToken;
exports.sendToken = sendToken;