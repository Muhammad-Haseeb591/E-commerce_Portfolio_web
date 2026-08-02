// const nodemailer = require("nodemailer");
// const transporter = nodemailer.createTransport({
//   host: "smtp-relay.brevo.com",
//   port: 2525,      
//   secure: false,
//   auth: {
//     user: process.env.BREVO_SMTP_LOGIN,
//     pass: process.env.BREVO_SMTP_KEY,
//   },
// });
// // ==============================
// // Generic sendEmail
// // ==============================
// const sendEmail = async ({ to, subject, html }) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_FROM || process.env.SMTP_USER,
//     to,
//     subject,
//     html,
//   });
// };

// // ==============================
// // OTP Email (registration verification)
// // ==============================
// const sendOtpEmail = async (email, otp) => {
//   await sendEmail({
//     to: email,
//     subject: "Verify your email - OTP",
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
//         <h2>Email Verification</h2>
//         <p>Your OTP for email verification is:</p>
//         <h1 style="letter-spacing: 4px;">${otp}</h1>
//         <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
//       </div>
//     `,
//   });
// };

// // ==============================
// // Forgot Password Email
// // ==============================
// const sendResetPasswordEmail = async (email, resetUrl) => {
//   await sendEmail({
//     to: email,
//     subject: "Reset your password",
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
//         <h2>Password Reset Request</h2>
//         <p>Click the button below to reset your password. This link is valid for 15 minutes.</p>
//         <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">
//           Reset Password
//         </a>
//         <p>If the button doesn't work, copy and paste this link into your browser:</p>
//         <p>${resetUrl}</p>
//         <p>If you did not request this, please ignore this email.</p>
//       </div>
//     `,
//   });
// };

// // ==============================
// // 🔑 NEW — Abandoned Cart Reminder Email
// // ==============================
// // Sent by the abandonedCartReminder cron job when a user's cart has sat
// // untouched for 1+ hour. `cartUrl` should point at your site's /cart
// // page (e.g. `${process.env.FRONTEND_URL}/cart`).
// const sendAbandonedCartEmail = async (email, { itemCount, cartUrl }) => {
//   const itemWord = itemCount === 1 ? "item" : "items";

//   await sendEmail({
//     to: email,
//     subject: "You left something in your cart",
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
//         <h2>Still thinking it over?</h2>
//         <p>You have ${itemCount} ${itemWord} waiting in your cart. Come back and grab it before it's gone.</p>
//         <a href="${cartUrl}" style="display:inline-block;padding:10px 20px;background:#333333;color:#fff;text-decoration:none;border-radius:6px;">
//           View My Cart
//         </a>
//         <p>If you already checked out or your cart isn't important right now, feel free to ignore this email.</p>
//       </div>
//     `,
//   });
// };

// // ==============================
// // 🔑 NEW — Order Confirmation Email
// // ==============================
// // Sent right when an order is successfully placed. `trackUrl` should
// // point at the account orders page (e.g. `${FRONTEND_URL}/account/orders`)
// // — but only pass/use it when the order was placed by a LOGGED-IN user,
// // since /account/orders requires login (guest checkouts have nothing to
// // show there yet). When `isLoggedIn` is false, the tracking button is
// // simply left out of the email.
// const sendOrderConfirmationEmail = async (email, { orderId, total, isLoggedIn, trackUrl }) => {
//   const trackButton =
//     isLoggedIn && trackUrl
//       ? `
//         <a href="${trackUrl}" style="display:inline-block;padding:10px 20px;background:#333333;color:#fff;text-decoration:none;border-radius:6px;margin-top:12px;">
//           Check / Track My Order
//         </a>
//       `
//       : "";

//   await sendEmail({
//     to: email,
//     subject: "Your order was placed successfully",
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
//         <h2>Order confirmed 🎉</h2>
//         <p>Thanks for your order! It's been placed successfully.</p>
//         <p><strong>Order ID:</strong> ${orderId}</p>
//         <p><strong>Total:</strong> ${total}</p>
//         ${trackButton}
//         <p style="margin-top:16px;">We'll let you know once it's on its way.</p>
//       </div>
//     `,
//   });
// };

// module.exports = {
//   sendEmail,
//   sendOtpEmail,
//   sendResetPasswordEmail,
//   sendAbandonedCartEmail,
//   sendOrderConfirmationEmail,
// };

const { Resend } = require("resend");

// ==============================
// OLD — Nodemailer / Brevo SMTP setup (commented out, kept for reference)
// ==============================
// const nodemailer = require("nodemailer");
// const transporter = nodemailer.createTransport({
//   host: "smtp-relay.brevo.com",
//   port: 2525,
//   secure: false,
//   auth: {
//     user: process.env.BREVO_SMTP_LOGIN,
//     pass: process.env.BREVO_SMTP_KEY,
//   },
// });

// ==============================
// NEW — Resend setup
// ==============================
const resend = new Resend(process.env.RESEND_API_KEY);

// ==============================
// Generic sendEmail
// ==============================
const sendEmail = async ({ to, subject, html }) => {
  // OLD (nodemailer/Brevo) — commented out
  // await transporter.sendMail({
  //   from: process.env.EMAIL_FROM || process.env.SMTP_USER,
  //   to,
  //   subject,
  //   html,
  // });

  // NEW (Resend)
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev", // Resend ka free default sender (verified domain na ho to ye use hota hai)
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
// Abandoned Cart Reminder Email
// ==============================
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

// ==============================
// Order Confirmation Email
// ==============================
const sendOrderConfirmationEmail = async (email, { orderId, total, isLoggedIn, trackUrl }) => {
  const trackButton =
    isLoggedIn && trackUrl
      ? `
        <a href="${trackUrl}" style="display:inline-block;padding:10px 20px;background:#333333;color:#fff;text-decoration:none;border-radius:6px;margin-top:12px;">
          Check / Track My Order
        </a>
      `
      : "";

  await sendEmail({
    to: email,
    subject: "Your order was placed successfully",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Order confirmed 🎉</h2>
        <p>Thanks for your order! It's been placed successfully.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Total:</strong> ${total}</p>
        ${trackButton}
        <p style="margin-top:16px;">We'll let you know once it's on its way.</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendResetPasswordEmail,
  sendAbandonedCartEmail,
  sendOrderConfirmationEmail,
};