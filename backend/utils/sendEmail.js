const nodemailer = require("nodemailer");

// ==============================
// Transporter
// ==============================
// .env me ye variables chahiye:
// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=465
// SMTP_USER=your-email@gmail.com
// SMTP_PASS=your-app-password   (Gmail App Password, normal password nahi chalega)
// EMAIL_FROM="MyApp <no-reply@myapp.com>"
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT) || 465,
//   secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports (587)
//   pool: true,          // reuse SMTP connections instead of a fresh TLS handshake per email
//   maxConnections: 5,
//   maxMessages: 100,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // STARTTLS on 587
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

module.exports = { sendEmail, sendOtpEmail, sendResetPasswordEmail };