import { z } from 'zod';

/**
 * Validation schema for User Registration
 */
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(3, 'Name must be at least 3 characters long')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format')
    .max(255, 'Email cannot exceed 255 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
});

/**
 * Validation schema for User Login
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format')
    .max(255, 'Email cannot exceed 255 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(128, 'Password cannot exceed 128 characters'),
});

/**
 * Validation schema for Google OAuth
 */
export const googleAuthSchema = z.object({
  idToken: z
    .string({ required_error: 'Firebase idToken is required' })
    .trim()
    .min(1, 'Firebase idToken cannot be empty')
    .max(8192, 'Firebase idToken is too long'),
});

/**
 * Validation schema for Onboarding Questionnaire
 */
export const onboardingSchema = z.object({
  risk_preference: z
    .enum(['low', 'medium', 'high'], {
      invalid_type_error: 'risk_preference must be one of: low, medium, high',
    })
    .optional(),
  investment_goal: z
    .enum(['grow_savings', 'regular_income', 'just_exploring'], {
      invalid_type_error: 'investment_goal must be one of: grow_savings, regular_income, just_exploring',
    })
    .optional(),
  screening_strictness: z
    .enum(['standard', 'strict'], {
      invalid_type_error: 'screening_strictness must be one of: standard, strict',
    })
    .optional(),
  skip: z.boolean().optional(),
});

/**
 * Validation schema for Token Refresh
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .trim()
    .min(1, 'Refresh token cannot be empty')
    .max(2048, 'Refresh token is too long'),
});

/**
 * Validation schema for Forgot Password (Request OTP)
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format')
    .max(255, 'Email cannot exceed 255 characters'),
});

/**
 * Validation schema for Reset Password (Verify OTP & Set New Password)
 */
export const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format')
    .max(255, 'Email cannot exceed 255 characters'),
  otp: z
    .string({ required_error: 'OTP code is required' })
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'New password cannot exceed 128 characters'),
});

/**
 * Validation schema for Verify Email (Signup OTP)
 */
export const verifyEmailSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format')
    .max(255, 'Email cannot exceed 255 characters'),
  otp: z
    .string({ required_error: 'OTP code is required' })
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

/**
 * Validation schema for Resend Verification OTP
 */
export const resendVerificationSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format')
    .max(255, 'Email cannot exceed 255 characters'),
});

export default {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  onboardingSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
};
