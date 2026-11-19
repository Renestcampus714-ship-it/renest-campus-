import { z } from 'zod';
import {
  ACCOMMODATION_TYPES,
  CATEGORY_NAMES,
  ITEM_CONDITIONS,
  REPORT_REASONS,
  VALIDATION_LIMITS,
} from '../constants/marketplace';

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(VALIDATION_LIMITS.fullNameMin, 'Full name must be at least 2 characters.')
      .max(VALIDATION_LIMITS.fullNameMax, 'Full name cannot exceed 100 characters.'),
    email: z
      .string()
      .trim()
      .email('Enter a valid email address.')
      .min(VALIDATION_LIMITS.emailMin)
      .max(VALIDATION_LIMITS.emailMax),
    collegeName: z
      .string()
      .trim()
      .min(VALIDATION_LIMITS.collegeNameMin, 'Enter your college or university name.')
      .max(VALIDATION_LIMITS.collegeNameMax, 'College name cannot exceed 150 characters.'),
    accommodationType: z.enum(
      ACCOMMODATION_TYPES as unknown as [string, ...string[]],
      { error: 'Select your accommodation type.' }
    ),
    phone: z
      .string()
      .trim()
      .max(VALIDATION_LIMITS.phoneMax, 'Phone number cannot exceed 20 characters.')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .max(128, 'Password is too long.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter the email address associated with your account.'),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long.')
      .max(128, 'Password is too long.'),
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(VALIDATION_LIMITS.fullNameMin, 'Full name must be at least 2 characters.')
    .max(VALIDATION_LIMITS.fullNameMax),
  collegeName: z
    .string()
    .trim()
    .min(VALIDATION_LIMITS.collegeNameMin, 'Enter your college or university name.')
    .max(VALIDATION_LIMITS.collegeNameMax),
  accommodationType: z.enum(ACCOMMODATION_TYPES as unknown as [string, ...string[]]),
  phone: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.phoneMax, 'Phone number cannot exceed 20 characters.')
    .optional()
    .or(z.literal('')),
});

export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(VALIDATION_LIMITS.titleMin, 'Title must be at least 3 characters.')
    .max(VALIDATION_LIMITS.titleMax, 'Title cannot exceed 120 characters.'),
  description: z
    .string()
    .trim()
    .min(VALIDATION_LIMITS.descriptionMin, 'Description must be at least 10 characters.')
    .max(VALIDATION_LIMITS.descriptionMax, 'Description cannot exceed 2000 characters.'),
  category: z.enum(CATEGORY_NAMES as unknown as [string, ...string[]], {
    error: 'Select a product category.',
  }),
  price: z.coerce
    .number({ error: 'Enter a valid price in INR.' })
    .min(0, 'Price cannot be negative.')
    .max(VALIDATION_LIMITS.maxPrice, 'Price cannot exceed ₹5,00,000.'),
  condition: z.enum(ITEM_CONDITIONS as unknown as [string, ...string[]], {
    error: 'Select the item condition.',
  }),
  location: z
    .string()
    .trim()
    .min(VALIDATION_LIMITS.locationMin, 'Specify a campus or hostel handover location.')
    .max(VALIDATION_LIMITS.locationMax, 'Location cannot exceed 120 characters.'),
});

export const enquirySchema = z.object({
  message: z
    .string()
    .trim()
    .min(VALIDATION_LIMITS.messageMin, 'Message must be at least 3 characters.')
    .max(VALIDATION_LIMITS.messageMax, 'Message cannot exceed 1000 characters.'),
  preferredHandoverLocation: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.handoverLocationMax)
    .optional()
    .or(z.literal('')),
});

export const transactionCreateSchema = z.object({
  handoverLocation: z
    .string()
    .trim()
    .min(VALIDATION_LIMITS.handoverLocationMin, 'Enter a handover location.')
    .max(VALIDATION_LIMITS.handoverLocationMax),
  handoverWindow: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.handoverWindowMax)
    .optional()
    .or(z.literal('')),
});

export const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS as unknown as [string, ...string[]], {
    error: 'Select a reason for reporting.',
  }),
  description: z
    .string()
    .trim()
    .min(VALIDATION_LIMITS.reportDescriptionMin, 'Provide brief details (at least 5 characters).')
    .max(VALIDATION_LIMITS.reportDescriptionMax),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;
export type ListingFormValues = z.infer<typeof listingSchema>;
export type EnquiryFormValues = z.infer<typeof enquirySchema>;
export type TransactionCreateFormValues = z.infer<typeof transactionCreateSchema>;
export type ReportFormValues = z.infer<typeof reportSchema>;
