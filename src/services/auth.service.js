import jwt from 'jsonwebtoken';
import { User, UserToken } from '../models/index.js';
import { ApiError } from '../utils/index.js';
import { verifyFirebaseIdToken } from '../config/firebase.js';
import { env } from '../config/env.js';
import { sendPasswordResetEmail, sendVerificationEmail } from './mail.service.js';

/**
 * Helper to generate Access and Refresh tokens and persist refresh token in user_tokens table
 * @param {string} userId
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
export const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found for token generation');
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Expiry calculation for Refresh Token (Default: 7 days)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Store new token session in user_tokens table (Supports Multiple Devices)
  await UserToken.create({
    user_id: user.id,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    is_revoked: false,
  });

  return { accessToken, refreshToken };
};

/**
 * Register a new user
 * Generates a 6-digit verification OTP and dispatches verification email
 */
export const registerUserService = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Generate 6-digit numeric OTP valid for 15 minutes
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password_hash: password,
    auth_provider: 'local',
    onboarding_completed: false,
    is_email_verified: false,
    verification_otp: otp,
    verification_otp_expires_at: expiresAt,
  });

  console.log(`[SIGNUP VERIFICATION OTP] For ${normalizedEmail}: ${otp} (valid for 15m)`);

  // Dispatch verification email via Nodemailer
  await sendVerificationEmail(normalizedEmail, otp, user.name);

  return {
    user: user.toJSON(),
    message:
      'Registration successful. A 6-digit verification code has been sent to your email. Please verify your email to activate your account.',
  };
};

/**
 * Login user with email & password
 */
export const loginUserService = async ({ email, password }) => {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.password_hash) {
    throw new ApiError(
      400,
      'This account was created with Google Sign-In. Please sign in using Google.'
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.is_email_verified) {
    throw new ApiError(
      403,
      'Please verify your email address before logging in. If your verification code has expired, please request a new one.',
      [],
      'EMAIL_NOT_VERIFIED'
    );
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
};

/**
 * Authenticate with Google Firebase ID Token
 */
export const googleAuthService = async (idToken) => {
  let decodedToken;
  try {
    decodedToken = await verifyFirebaseIdToken(idToken);
  } catch (error) {
    throw new ApiError(401, `Invalid or expired Google/Firebase token: ${error.message}`);
  }

  const { email, name, picture } = decodedToken;

  if (!email) {
    throw new ApiError(400, 'Google account does not have an associated email address');
  }

  let user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

  if (!user) {
    user = await User.create({
      name: name || email.split('@')[0],
      email: email.toLowerCase().trim(),
      avatar_url: picture || null,
      auth_provider: 'google',
      password_hash: null,
      onboarding_completed: false,
      is_email_verified: true,
    });
  } else {
    let shouldSave = false;
    if (!user.is_email_verified) {
      user.is_email_verified = true;
      shouldSave = true;
    }
    if (picture && !user.avatar_url) {
      user.avatar_url = picture;
      shouldSave = true;
    }
    if (shouldSave) {
      await user.save();
    }
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
};

/**
 * Update or Skip user onboarding preferences
 */
export const completeOnboardingService = async (
  userId,
  { risk_preference, investment_goal, screening_strictness }
) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.risk_preference = risk_preference || user.risk_preference || 'medium';
  user.investment_goal = investment_goal || user.investment_goal || 'grow_savings';
  user.screening_strictness = screening_strictness || user.screening_strictness || 'standard';
  user.onboarding_completed = true;

  await user.save();

  return { user: user.toJSON() };
};

/**
 * Refresh expired access token with token rotation in user_tokens table
 */
export const refreshTokenService = async (incomingRefreshToken) => {
  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      env.jwt.refreshSecret
    );

    const tokenRecord = await UserToken.findOne({
      where: {
        user_id: decoded.id,
        refresh_token: incomingRefreshToken,
        is_revoked: false,
      },
    });

    if (!tokenRecord) {
      throw new ApiError(401, 'Refresh token is expired or has been revoked');
    }

    // Revoke old refresh token (Token Rotation)
    tokenRecord.is_revoked = true;
    await tokenRecord.save();

    // Issue new token pair
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(decoded.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
};

/**
 * Logout user by revoking token in user_tokens table
 */
export const logoutUserService = async (userId, incomingRefreshToken = null, logoutAll = false) => {
  if (logoutAll) {
    await UserToken.update(
      { is_revoked: true },
      { where: { user_id: userId } }
    );
  } else if (incomingRefreshToken) {
    await UserToken.update(
      { is_revoked: true },
      { where: { user_id: userId, refresh_token: incomingRefreshToken } }
    );
  } else {
    await UserToken.update(
      { is_revoked: true },
      { where: { user_id: userId } }
    );
  }
  return true;
};

/**
 * Get user profile by ID
 */
export const getUserProfileService = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user.toJSON();
};

/**
 * Request Password Reset OTP
 * Generates a 6-digit numeric OTP valid for 15 minutes and dispatches email
 * Does NOT expose OTP in response body (supports both local and Google accounts in DB)
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 */
export const forgotPasswordService = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    throw new ApiError(404, 'User with this email does not exist');
  }

  // Generate 6-digit cryptographically random OTP (100000 - 999999)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

  user.reset_password_otp = otp;
  user.reset_password_otp_expires_at = expiresAt;
  await user.save();

  console.log(`[PASSWORD RESET OTP] For ${normalizedEmail}: ${otp} (valid for 15m)`);

  // Send real email via Nodemailer
  await sendPasswordResetEmail(normalizedEmail, otp, user.name || 'User');

  return {
    message: 'Password reset code has been sent to your email.',
  };
};

/**
 * Verify OTP and reset password
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.otp
 * @param {string} params.newPassword
 * @returns {Promise<{ message: string }>}
 */
export const resetPasswordService = async ({ email, otp, newPassword }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    throw new ApiError(404, 'User with this email does not exist');
  }

  if (!user.reset_password_otp || !user.reset_password_otp_expires_at) {
    throw new ApiError(400, 'No active password reset request found. Please request a new OTP.');
  }

  if (new Date() > new Date(user.reset_password_otp_expires_at)) {
    user.reset_password_otp = null;
    user.reset_password_otp_expires_at = null;
    await user.save();
    throw new ApiError(400, 'OTP code has expired. Please request a new one.');
  }

  if (user.reset_password_otp !== otp.trim()) {
    throw new ApiError(400, 'Invalid OTP code provided.');
  }

  // Set new password (beforeSave hook in User model will hash it)
  user.password_hash = newPassword;
  user.is_email_verified = true;
  user.reset_password_otp = null;
  user.reset_password_otp_expires_at = null;
  await user.save();

  // Invalidate all existing login sessions across devices for security
  await UserToken.update(
    { is_revoked: true },
    { where: { user_id: user.id } }
  );

  return {
    message: 'Password has been reset successfully. Please log in with your new password.',
  };
};

/**
 * Verify email address with 6-digit OTP code
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.otp
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string, message: string }>}
 */
export const verifyEmailService = async ({ email, otp }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    throw new ApiError(404, 'User with this email does not exist');
  }

  if (user.is_email_verified) {
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);
    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
      message: 'Email is already verified.',
    };
  }

  if (!user.verification_otp || !user.verification_otp_expires_at) {
    throw new ApiError(
      400,
      'No active verification request found. Please request a new verification code.'
    );
  }

  if (new Date() > new Date(user.verification_otp_expires_at)) {
    user.verification_otp = null;
    user.verification_otp_expires_at = null;
    await user.save();
    throw new ApiError(400, 'Verification code has expired. Please request a new one.');
  }

  if (user.verification_otp !== otp.trim()) {
    throw new ApiError(400, 'Invalid verification code provided.');
  }

  user.is_email_verified = true;
  user.verification_otp = null;
  user.verification_otp_expires_at = null;
  await user.save();

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
    message: 'Email verified successfully. Welcome to Halalify!',
  };
};

/**
 * Resend email verification OTP
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 */
export const resendVerificationOtpService = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    throw new ApiError(404, 'User with this email does not exist');
  }

  if (user.is_email_verified) {
    throw new ApiError(400, 'Email address is already verified.');
  }

  // Generate 6-digit numeric OTP valid for 15 minutes
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  user.verification_otp = otp;
  user.verification_otp_expires_at = expiresAt;
  await user.save();

  console.log(`[VERIFICATION OTP RESENT] For ${normalizedEmail}: ${otp} (valid for 15m)`);

  // Dispatch email via Nodemailer
  await sendVerificationEmail(normalizedEmail, otp, user.name || 'User');

  return {
    message: 'Verification code has been resent to your email address.',
  };
};

export default {
  generateAccessAndRefreshTokens,
  registerUserService,
  loginUserService,
  googleAuthService,
  completeOnboardingService,
  refreshTokenService,
  logoutUserService,
  getUserProfileService,
  forgotPasswordService,
  resetPasswordService,
  verifyEmailService,
  resendVerificationOtpService,
};


