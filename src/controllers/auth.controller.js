import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { ApiError, ApiResponse, asyncHandler } from '../utils/index.js';
import { verifyFirebaseIdToken } from '../config/firebase.js';

// Valid enum values for validation
const VALID_RISK_PREFERENCES = ['low', 'medium', 'high'];
const VALID_INVESTMENT_GOALS = ['grow_savings', 'regular_income', 'just_exploring'];
const VALID_SCREENING_STRICTNESS = ['standard', 'strict'];

/**
 * Helper to generate Access and Refresh tokens and persist refresh token
 * @param {string} userId
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found for token generation');
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refresh_token = refreshToken;
  await user.save({ validate: false });

  return { accessToken, refreshToken };
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Create User with onboarding_completed: false
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password_hash: password,
    auth_provider: 'local',
    onboarding_completed: false,
  });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  return new ApiResponse(
    201,
    {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    },
    'User registered successfully'
  ).send(res);
});

/**
 * @desc    Log in user & get tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

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

  return new ApiResponse(
    200,
    {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    },
    'User logged in successfully'
  ).send(res);
});

/**
 * @desc    Authenticate with Google via Firebase ID Token
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new ApiError(400, 'Firebase idToken is required for Google authentication');
  }

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

  // Check if user already exists
  let user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

  if (!user) {
    // Register new user via Google
    user = await User.create({
      name: name || email.split('@')[0],
      email: email.toLowerCase().trim(),
      avatar_url: picture || null,
      auth_provider: 'google',
      password_hash: null,
      onboarding_completed: false, // New user needs to do onboarding
    });
  } else {
    // Existing user: Update avatar if missing or changed
    if (picture && !user.avatar_url) {
      user.avatar_url = picture;
      await user.save();
    }
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  return new ApiResponse(
    200,
    {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    },
    'Google authentication successful'
  ).send(res);
});

/**
 * @desc    Complete, Update, or Skip user onboarding preferences
 * @route   POST /api/auth/onboarding
 * @access  Private (Authenticated)
 */
export const completeOnboarding = asyncHandler(async (req, res) => {
  const { risk_preference, investment_goal, screening_strictness } = req.body || {};

  // Validate inputs if provided
  if (risk_preference && !VALID_RISK_PREFERENCES.includes(risk_preference)) {
    throw new ApiError(400, `Invalid risk_preference. Must be one of: ${VALID_RISK_PREFERENCES.join(', ')}`);
  }
  if (investment_goal && !VALID_INVESTMENT_GOALS.includes(investment_goal)) {
    throw new ApiError(400, `Invalid investment_goal. Must be one of: ${VALID_INVESTMENT_GOALS.join(', ')}`);
  }
  if (screening_strictness && !VALID_SCREENING_STRICTNESS.includes(screening_strictness)) {
    throw new ApiError(400, `Invalid screening_strictness. Must be one of: ${VALID_SCREENING_STRICTNESS.join(', ')}`);
  }

  const user = await User.findByPk(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Set provided values or fallback to safe defaults if skipped
  user.risk_preference = risk_preference || user.risk_preference || 'medium';
  user.investment_goal = investment_goal || user.investment_goal || 'grow_savings';
  user.screening_strictness = screening_strictness || user.screening_strictness || 'standard';
  user.onboarding_completed = true;

  await user.save();

  return new ApiResponse(
    200,
    { user: user.toJSON() },
    'Onboarding completed successfully'
  ).send(res);
});

/**
 * @desc    Refresh expired access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.body.refreshToken || req.headers['x-refresh-token'];

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret'
    );

    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new ApiError(401, 'Invalid refresh token: User not found');
    }

    if (user.refresh_token !== incomingRefreshToken) {
      throw new ApiError(401, 'Refresh token is expired or has been revoked');
    }

    // Token rotation: Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user.id);

    return new ApiResponse(
      200,
      {
        accessToken,
        refreshToken: newRefreshToken,
      },
      'Access token refreshed successfully'
    ).send(res);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
});

/**
 * @desc    Log out user & invalidate refresh token
 * @route   POST /api/auth/logout
 * @access  Private (Authenticated)
 */
export const logoutUser = asyncHandler(async (req, res) => {
  await User.update(
    { refresh_token: null },
    { where: { id: req.user.id } }
  );

  return new ApiResponse(200, {}, 'User logged out successfully').send(res);
});

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private (Authenticated)
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  return new ApiResponse(
    200,
    { user: req.user },
    'Current user profile fetched successfully'
  ).send(res);
});
