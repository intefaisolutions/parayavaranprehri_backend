import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const otpRequestSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(10).max(15).optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Either email or phone must be provided',
  });

export const otpVerifySchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(10).max(15).optional(),
    code: z
      .string({ message: 'Please enter your OTP' })
      .length(4, 'OTP must be exactly 4 digits'),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Either email or phone must be provided',
  });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const registerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(1).max(50),
  mobile: z
    .string()
    .min(10)
    .max(15)
    .regex(/^\d+$/, 'Mobile must contain digits only'),
  email: z.string().email(),
  gender: z.enum(['Male', 'Female', 'Other']),
  address: z.string().min(5).max(300),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type OtpRequestDto = z.infer<typeof otpRequestSchema>;
export type OtpVerifyDto = z.infer<typeof otpVerifySchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;

export interface RegisterResponse {
  message: string;
  phone: string;
  insuranceVerified: boolean;
  vehiclesLinked: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse extends TokenPair {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
  };
}
