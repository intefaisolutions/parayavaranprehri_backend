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

export type LoginDto = z.infer<typeof loginSchema>;
export type OtpRequestDto = z.infer<typeof otpRequestSchema>;
export type OtpVerifyDto = z.infer<typeof otpVerifySchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

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
