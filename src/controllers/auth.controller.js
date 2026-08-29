import {
  registerUserService,
  loginUserService,
  googleAuthService,
  completeOnboardingService,
  refreshTokenService,
  logoutUserService,
  getUserProfileService,
} from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const result = await registerUserService(req.body);
  return new ApiResponse(201, result, 'User registered successfully').send(res);
});

/**
 * @desc    Log in user & get tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const result = await loginUserService(req.body);
  return new ApiResponse(200, result, 'User logged in successfully').send(res);
});

/**
 * @desc    Authenticate with Google via Firebase ID Token
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const result = await googleAuthService(idToken);
  return new ApiResponse(200, result, 'Google authentication successful').send(res);
});

/**
 * @desc    Complete, Update, or Skip user onboarding preferences
 * @route   POST /api/auth/onboarding
 * @access  Private (Authenticated)
 */
export const completeOnboarding = asyncHandler(async (req, res) => {
  const result = await completeOnboardingService(req.user.id, req.body || {});
  return new ApiResponse(200, result, 'Onboarding completed successfully').send(res);
});

/**
 * @desc    Refresh expired access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.body.refreshToken || req.headers['x-refresh-token'];
  const result = await refreshTokenService(incomingRefreshToken);
  return new ApiResponse(200, result, 'Access token refreshed successfully').send(res);
});

/**
 * @desc    Log out user & invalidate refresh token
 * @route   POST /api/auth/logout
 * @access  Private (Authenticated)
 */
export const logoutUser = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.body.refreshToken || req.headers['x-refresh-token'] || null;
  const logoutAll = req.body.logoutAll === true;

  await logoutUserService(req.user.id, incomingRefreshToken, logoutAll);
  return new ApiResponse(200, {}, 'User logged out successfully').send(res);
});

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private (Authenticated)
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await getUserProfileService(req.user.id);
  return new ApiResponse(
    200,
    { user },
    'Current user profile fetched successfully'
  ).send(res);
});
