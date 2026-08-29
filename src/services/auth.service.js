import jwt from 'jsonwebtoken';
import { User, UserToken } from '../models/index.js';
import { ApiError } from '../utils/index.js';
import { verifyFirebaseIdToken } from '../config/firebase.js';

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
 */
export const registerUserService = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password_hash: password,
    auth_provider: 'local',
    onboarding_completed: false,
  });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
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
    });
  } else {
    if (picture && !user.avatar_url) {
      user.avatar_url = picture;
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
      process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret'
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
