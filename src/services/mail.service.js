import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

/**
 * Get or initialize Nodemailer transporter instance
 */
export const getMailTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const { host, port, user, pass } = env.mail;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587 / other ports
      auth: {
        user,
        pass,
      },
    });
  } else {
    // Fallback development mode: JSON transport (logs to console safely)
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter;
};

/**
 * Send password reset email matching Cloudflare style
 * @param {string} to - Recipient email
 * @param {string} otp - Verification code / OTP
 * @param {string} [name='User'] - User's name
 */
export const sendPasswordResetEmail = async (to, otp, name = 'User') => {
  const mailTransporter = getMailTransporter();

  const plainText = `A password reset was requested for your Halalify account

You requested to reset the password for your account (${to}). Enter this code directly on the password reset page:

${otp}

This code will expire in 15 minutes. If your code has expired, you can request a new one.

If you did not request this, you can safely ignore this email. Your password will not be changed.

Why am I receiving this email?
A password reset was requested for the account associated with ${to}.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; padding: 36px 32px; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        
        <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 20px; line-height: 1.4;">
          A password reset was requested for your Halalify account
        </h2>
        
        <p style="font-size: 15px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
          You requested to reset the password for your account (<a href="mailto:${to}" style="color: #059669; text-decoration: none;">${to}</a>). Enter this code directly on the password reset page:
        </p>

        <div style="background-color: #f3f4f6; border-radius: 6px; padding: 18px 24px; text-align: center; margin: 28px 0; border: 1px solid #e5e7eb;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #065f46; word-break: break-all;">
            ${otp}
          </span>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 16px;">
          This code will expire in <strong>15 minutes</strong>. If your code has expired, you can request a new one on the password reset page.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 28px;">
          If you did not request this, you can safely ignore this email. Your password will not be changed.
        </p>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 24px;">
          <p style="font-size: 13px; font-weight: 600; color: #6b7280; margin-bottom: 6px;">
            Why am I receiving this email?
          </p>
          <p style="font-size: 13px; line-height: 1.5; color: #9ca3af; margin: 0;">
            A password reset was requested for the account associated with <a href="mailto:${to}" style="color: #6b7280; text-decoration: underline;">${to}</a>.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: env.mail.from,
    to,
    subject: 'A password reset was requested for your Halalify account',
    text: plainText,
    html: htmlContent,
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`[EMAIL] Password reset code sent to ${to} (MessageId: ${info.messageId || 'development-json'})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send signup verification OTP email
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {string} [name='User'] - User's name
 */
export const sendVerificationEmail = async (to, otp, name = 'User') => {
  const mailTransporter = getMailTransporter();

  const plainText = `Welcome to Halalify! Verify your email address

You recently registered an account on Halalify with (${to}). Enter this verification code to activate your account:

${otp}

This code will expire in 15 minutes.

If you did not create an account on Halalify, please disregard this email.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; padding: 36px 32px; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        
        <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 20px; line-height: 1.4;">
          Verify your email address for Halalify
        </h2>
        
        <p style="font-size: 15px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
          Assalamu Alaikum <strong>${name}</strong>,<br><br>
          Thank you for signing up for Halalify. Enter this 6-digit verification code to verify your email address:
        </p>

        <div style="background-color: #ecfdf5; border-radius: 6px; padding: 18px 24px; text-align: center; margin: 28px 0; border: 1px solid #a7f3d0;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #047857; word-break: break-all;">
            ${otp}
          </span>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 16px;">
          This code will expire in <strong>15 minutes</strong>.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 28px;">
          If you did not register for Halalify, you can safely ignore this email.
        </p>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 24px;">
          <p style="font-size: 12px; line-height: 1.5; color: #9ca3af; text-align: center; margin: 0;">
            Halalify — Shariah-Compliant AI Investment Platform
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: env.mail.from,
    to,
    subject: 'Verify your email address - Halalify',
    text: plainText,
    html: htmlContent,
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`[EMAIL] Signup verification code sent to ${to} (MessageId: ${info.messageId || 'development-json'})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send verification email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default {
  getMailTransporter,
  sendPasswordResetEmail,
  sendVerificationEmail,
};
