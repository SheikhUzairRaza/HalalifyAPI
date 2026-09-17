import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/index.js';
import { env } from '../config/env.js';

/**
 * Authentication Middleware
 * Verifies JWT Access Token from Authorization Header
 */
export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Unauthorized: Access token is missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new ApiError(401, 'Unauthorized: Access token not provided');
  }

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash', 'refresh_token'] },
    });

    if (!user) {
      throw new ApiError(401, 'Unauthorized: User account no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Unauthorized: Access token has expired');
    }
    throw new ApiError(401, 'Unauthorized: Invalid access token');
  }
});

export default protect;
