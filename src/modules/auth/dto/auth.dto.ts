import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const otpRequestSchema = z.object({
  email: z.string().email(),
});

export const otpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
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
