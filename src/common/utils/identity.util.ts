import { BadRequestException } from '@nestjs/common';

/** Normalize Indian mobile to last 10 digits for uniqueness checks. */
export function normalizeMobile(mobile?: string | null): string | undefined {
  if (!mobile) return undefined;
  const digits = mobile.replace(/\D/g, '');
  if (!digits) return undefined;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(-10);
}

/** Require a valid 10-digit Indian mobile after normalization. */
export function requireMobile(mobile?: string | null): string {
  const normalized = normalizeMobile(mobile);
  if (!normalized || normalized.length !== 10) {
    throw new BadRequestException(
      'Mobile number must be a valid 10-digit Indian number',
    );
  }
  return normalized;
}

export function normalizeEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const value = email.trim().toLowerCase();
  return value || undefined;
}

export function requireEmail(email?: string | null): string {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new BadRequestException('Email is required');
  }
  return normalized;
}
