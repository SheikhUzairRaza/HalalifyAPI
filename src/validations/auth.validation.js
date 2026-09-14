import { z } from 'zod';

/**
 * Validation schema for User Registration
 */
export const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required' })
    .trim()
    .min(3, 'Name must be at least 3 characters long'),
  email: z.string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z.string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long'),
});

/**
 * Validation schema for User Login
 */
export const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z.string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

/**
 * Validation schema for Google OAuth
 */
export const googleAuthSchema = z.object({
  idToken: z.string({ required_error: 'Firebase idToken is required' })
    .trim()
    .min(1, 'Firebase idToken cannot be empty'),
});

/**
 * Validation schema for Onboarding Questionnaire
 */
export const onboardingSchema = z.object({
  risk_preference: z.enum(['low', 'medium', 'high'], {
    invalid_type_error: 'risk_preference must be one of: low, medium, high',
  }).optional(),
  investment_goal: z.enum(['grow_savings', 'regular_income', 'just_exploring'], {
    invalid_type_error: 'investment_goal must be one of: grow_savings, regular_income, just_exploring',
  }).optional(),
  screening_strictness: z.enum(['standard', 'strict'], {
    invalid_type_error: 'screening_strictness must be one of: standard, strict',
  }).optional(),
  skip: z.boolean().optional(),
});

/**
 * Validation schema for Token Refresh
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required' })
    .trim()
    .min(1, 'Refresh token cannot be empty'),
});
