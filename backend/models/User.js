const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const crypto   = require("crypto");
const { Schema } = mongoose;

const userSchema = new Schema({
  fullName: { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  googleId: { type: String, unique: true, sparse: true },
  password: { type: String, required: function () { return !this.googleId; } },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  // 🔑 Naya field — Google OAuth se profile picture URL yahan save hogi
  avatar: {
    type: String,
    default: "",
  },

  favourites: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
  ],

  // ==============================
  // Email Verification (OTP)
  // ==============================
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
    select: false, // normal queries me kabhi nahi aayega
  },
  otpExpiry: {
    type: Date,
    select: false,
  },

  // ==============================
  // Forgot / Reset Password
  // ==============================
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpiry: {
    type: Date,
    select: false,
  },

}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (!this.password) return; // Google-only users
  if (this.password.startsWith("$2b$")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
   console.log("Entered password:", enteredPassword);
};

// ==============================
// Generate 6-digit OTP, store hashed, return plain
// ==============================
userSchema.methods.generateOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

  this.otp = crypto.createHash("sha256").update(otp).digest("hex");
  this.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  return otp; // plain OTP — email me ye bhejna hai
};

userSchema.methods.verifyOtp = function (enteredOtp) {
  if (!this.otp || !this.otpExpiry) return false;
  if (this.otpExpiry < Date.now()) return false;

  const hashedEntered = crypto.createHash("sha256").update(enteredOtp).digest("hex");
  return hashedEntered === this.otp;
};

// ==============================
// Generate password reset token, store hashed, return plain
// ==============================
userSchema.methods.generateResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

  return resetToken; // plain token — email link me ye bhejna hai
};

module.exports = mongoose.model("User", userSchema);