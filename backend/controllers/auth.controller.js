const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendOtpEmail, sendResetPasswordEmail } = require("../services/sendemail.services");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ==============================
// Generate JWT Token
// ==============================
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ==============================
// Send Cookie + User (+ token in body, for header/Bearer-auth clients)
// ==============================
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
    message: "Authentication successful.",
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
};

// ==============================
// REGISTER  (creates unverified user + sends OTP)
// ==============================
exports.register = async (req, res) => {
  try {
    let { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    email = email.toLowerCase().trim();

    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Email already exists.",
        });
      }

      existing.fullName = fullName;
      existing.password = password;
      const otp = existing.generateOtp();
      await existing.save();

      sendOtpEmail(existing.email, otp)
        .then(() => console.log("OTP email accepted by SMTP for:", existing.email))
        .catch((err) => console.error("OTP email failed (register/existing):", err));

      return res.status(200).json({
        success: true,
        message: "Account exists but is unverified. A new OTP has been sent to your email.",
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
      .then(() => console.log("OTP email accepted by SMTP for:", user.email))
      .catch((err) => console.error(" OTP email failed (register/new):", err));

    return res.status(201).json({
      success: true,
      message: "Registration successful. OTP sent to your email for verification.",
      email: user.email,
    });

  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==============================
// VERIFY OTP  (activates account, logs user in)
// ==============================
exports.verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email }).select("+otp +otpExpiry");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified.",
      });
    }

    const isValid = user.verifyOtp(otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    sendToken(user, res);

  } catch (error) {
    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==============================
// RESEND OTP
// ==============================
exports.resendOtp = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified.",
      });
    }

    const otp = user.generateOtp();
    await user.save();

    sendOtpEmail(user.email, otp)
      .then(() => console.log("✅ OTP email accepted by SMTP for:", user.email))
      .catch((err) => console.error("❌ OTP email failed (resendOtp):", err));

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email.",
    });

  } catch (error) {
    console.error("Resend OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==============================
// LOGIN
// ==============================
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required.",
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google Sign-In. Please continue with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please verify your email with the OTP sent to you.",
        email: user.email,
      });
    }

    sendToken(user, res);

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==============================
// LOGOUT
// ==============================
exports.logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

// ==============================
// FORGOT PASSWORD  (sends reset link via email)
// ==============================
exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email is registered, a reset link has been sent.",
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

      console.error("Reset Email Error:", emailError);
      return res.status(500).json({
        success: false,
        message: "Could not send reset email. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "If that email is registered, a reset link has been sent.",
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==============================
// RESET PASSWORD  (uses token from email link)
// ==============================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required.",
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
        message: "Invalid or expired reset link.",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in.",
    });

  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==============================
// GET LOGGED-IN USER
// ==============================
exports.getMe = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("GetMe Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.generateToken = generateToken;
exports.sendToken = sendToken;