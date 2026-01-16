import { z } from 'zod';

// ============================================================================
// Common Validation Schemas
// ============================================================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const passwordSimpleSchema = z.string().min(8, 'Password must be at least 8 characters');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
  .optional()
  .or(z.literal(''));

export const urlSchema = z.string().url('Please enter a valid URL');

export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

// ============================================================================
// Auth Schemas
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm_password: z.string().min(1, 'Please confirm your password'),
    first_name: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
    last_name: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
    phone: phoneSchema,
    accept_terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const verifyEmailSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

// ============================================================================
// Store/Tenant Schemas
// ============================================================================

export const storeSetupSchema = z.object({
  name: z
    .string()
    .min(2, 'Store name must be at least 2 characters')
    .max(50, 'Store name must be at most 50 characters'),
  slug: slugSchema,
});

export const businessDetailsSchema = z.object({
  business_name: z.string().max(100, 'Business name is too long').optional(),
  business_type: z.string().min(1, 'Please select a business type'),
  phone: phoneSchema,
  address: z.string().max(200, 'Address is too long').optional(),
  city: z.string().max(100, 'City is too long').optional(),
  state: z.string().max(100, 'State is too long').optional(),
  postal_code: z.string().max(20, 'Postal code is too long').optional(),
  country: z.string().min(2, 'Please select a country').max(2),
  tax_id: z.string().max(50, 'Tax ID is too long').optional(),
});

// ============================================================================
// Product Schemas
// ============================================================================

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name is too long'),
  description: z.string().max(10000, 'Description is too long').optional(),
  short_description: z.string().max(500, 'Short description is too long').optional(),
  sku: z.string().max(50, 'SKU is too long').optional(),
  barcode: z.string().max(50, 'Barcode is too long').optional(),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0')
    .max(1000000, 'Price is too high'),
  compare_at_price: z
    .number()
    .positive('Compare at price must be greater than 0')
    .max(1000000)
    .optional()
    .nullable(),
  cost_price: z.number().min(0, 'Cost price cannot be negative').max(1000000).optional().nullable(),
  inventory_quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .max(1000000, 'Quantity is too high'),
  low_stock_threshold: z.number().int().min(0).max(10000).optional(),
  weight: z.number().min(0).optional(),
  category_id: z.string().uuid().optional().nullable(),
  vendor_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20, 'Too many tags').optional(),
  is_featured: z.boolean().optional(),
  is_taxable: z.boolean().optional(),
  requires_shipping: z.boolean().optional(),
});

export const productVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required').max(100),
  sku: z.string().max(50).optional(),
  price: z.number().positive('Price must be greater than 0').max(1000000),
  compare_at_price: z.number().positive().max(1000000).optional().nullable(),
  inventory_quantity: z.number().int().min(0).max(1000000),
  weight: z.number().min(0).optional(),
  options: z.array(
    z.object({
      name: z.string().min(1),
      value: z.string().min(1),
    })
  ),
});

// ============================================================================
// Order Schemas
// ============================================================================

export const orderItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  variant_id: z.string().uuid().optional(),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1')
    .max(100, 'Maximum quantity is 100'),
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  shipping_address: z.object({
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    address1: z.string().min(1, 'Address is required').max(200),
    address2: z.string().max(200).optional(),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().min(1, 'State is required').max(100),
    postal_code: z.string().min(1, 'Postal code is required').max(20),
    country: z.string().min(2, 'Country is required').max(2),
    phone: phoneSchema,
  }),
  billing_address: z
    .object({
      first_name: z.string().min(1).max(100),
      last_name: z.string().min(1).max(100),
      address1: z.string().min(1).max(200),
      address2: z.string().max(200).optional(),
      city: z.string().min(1).max(100),
      state: z.string().min(1).max(100),
      postal_code: z.string().min(1).max(20),
      country: z.string().min(2).max(2),
      phone: phoneSchema,
    })
    .optional(),
  coupon_codes: z.array(z.string().max(50)).max(5).optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

// ============================================================================
// Customer Schemas
// ============================================================================

export const customerSchema = z.object({
  email: emailSchema,
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  phone: phoneSchema,
  accepts_marketing: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(1000).optional(),
});

export const addressSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  company: z.string().max(100).optional(),
  address1: z.string().min(1, 'Address is required').max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  postal_code: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().min(2, 'Country is required').max(2),
  country_code: z.string().length(2, 'Country code must be 2 characters'),
  phone: phoneSchema,
  is_default: z.boolean().optional(),
  type: z.enum(['shipping', 'billing', 'both']).optional(),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
};

// Simple validation helpers
export const validateRequired = (value: string | undefined | null): boolean => {
  return value !== undefined && value !== null && value.trim().length > 0;
};

export const validatePositiveNumber = (value: string | number | undefined | null): boolean => {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

export const validatePhone = (phone: string): boolean => {
  return phoneSchema.safeParse(phone).success;
};

export const validateUrl = (url: string): boolean => {
  return urlSchema.safeParse(url).success;
};

export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = error.message;
    }
  });

  return { success: false, errors };
};

export const validateField = <T>(schema: z.ZodSchema<T>, value: unknown): string | null => {
  const result = schema.safeParse(value);
  if (result.success) {
    return null;
  }
  return result.error.errors[0]?.message || 'Invalid value';
};

// Export schema types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type StoreSetupFormData = z.infer<typeof storeSetupSchema>;
export type BusinessDetailsFormData = z.infer<typeof businessDetailsSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type OrderFormData = z.infer<typeof orderSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
