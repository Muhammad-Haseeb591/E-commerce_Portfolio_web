const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,      
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
});
// ==============================
// Generic sendEmail
// ==============================
const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};

// ==============================
// OTP Email (registration verification)
// ==============================
const sendOtpEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Verify your email - OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Email Verification</h2>
        <p>Your OTP for email verification is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

// ==============================
// Forgot Password Email
// ==============================
const sendResetPasswordEmail = async (email, resetUrl) => {
  await sendEmail({
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password. This link is valid for 15 minutes.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">
          Reset Password
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

// ==============================
// 🔑 NEW — Abandoned Cart Reminder Email
// ==============================
// Sent by the abandonedCartReminder cron job when a user's cart has sat
// untouched for 1+ hour. `cartUrl` should point at your site's /cart
// page (e.g. `${process.env.FRONTEND_URL}/cart`).
const sendAbandonedCartEmail = async (email, { itemCount, cartUrl }) => {
  const itemWord = itemCount === 1 ? "item" : "items";

  await sendEmail({
    to: email,
    subject: "You left something in your cart",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Still thinking it over?</h2>
        <p>You have ${itemCount} ${itemWord} waiting in your cart. Come back and grab it before it's gone.</p>
        <a href="${cartUrl}" style="display:inline-block;padding:10px 20px;background:#333333;color:#fff;text-decoration:none;border-radius:6px;">
          View My Cart
        </a>
        <p>If you already checked out or your cart isn't important right now, feel free to ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendOtpEmail, sendResetPasswordEmail, sendAbandonedCartEmail };