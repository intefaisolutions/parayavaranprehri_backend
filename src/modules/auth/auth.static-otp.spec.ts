import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRepository } from '../users/repositories/user.repository';
import { PersonsService } from '../../persons/persons.service';
import { MitrasService } from '../../mitras/mitras.service';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { EmailService, OtpRepository } from './services/email.service';
import { SmsService } from './services/sms.service';
import { WhatsappService } from '../../common/services/whatsapp.service';

describe('AuthService Static OTP & Demo Account Mode', () => {
  let authService: AuthService;
  let configMap: Record<string, string | number> = {};
  let otpStorage: Map<string, { code: string; isUsed: boolean; expiresAt: Date }> = new Map();
  let smsSentCalls: Array<{ phone: string; code: string }> = [];

  const mockUsersService = {
    findByEmail: jest.fn().mockImplementation(async (email) => null),
    findByPhone: jest.fn().mockImplementation(async (phone) => {
      if (phone === '8817678133') {
        return {
          _id: 'demo-user-id',
          phone: '8817678133',
          email: 'demo@paryavaranprahri.org',
          firstName: 'Demo',
          lastName: 'User',
          roles: ['user'],
          isActive: true,
        };
      }
      if (phone === '9876543210') {
        return {
          _id: 'regular-user-id',
          phone: '9876543210',
          email: 'user@example.com',
          firstName: 'Regular',
          lastName: 'User',
          roles: ['user'],
          isActive: true,
        };
      }
      return null;
    }),
    updateLastLogin: jest.fn().mockResolvedValue(true),
  };

  const mockUserRepository = {
    create: jest.fn().mockImplementation(async (data) => ({
      _id: 'created-demo-id',
      ...data,
    })),
    findById: jest.fn(),
  };

  const mockOtpRepository = {
    create: jest.fn().mockImplementation(async (email, code, expiresAt, userId) => {
      otpStorage.set(email, { code, isUsed: false, expiresAt });
      return { email, code, expiresAt, userId, isUsed: false };
    }),
    findValid: jest.fn().mockImplementation(async (email, code) => {
      const record = otpStorage.get(email);
      if (record && record.code === code && !record.isUsed && record.expiresAt > new Date()) {
        return { _id: 'otp-doc-id', email, code };
      }
      return null;
    }),
    markUsed: jest.fn().mockImplementation(async (id) => {
      // Marked as used
    }),
  };

  const mockSmsService = {
    sendOtp: jest.fn().mockImplementation(async (phone, code) => {
      smsSentCalls.push({ phone, code });
      return true;
    }),
  };

  const mockWhatsappService = {
    sendMessage: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockEmailService = {
    sendOtp: jest.fn().mockResolvedValue(true),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockRefreshTokenRepository = {
    create: jest.fn().mockResolvedValue(true),
    findByToken: jest.fn(),
    revokeToken: jest.fn(),
  };

  beforeEach(async () => {
    otpStorage.clear();
    smsSentCalls = [];
    configMap = {
      STATIC_OTP_MODE: 'true',
      STATIC_OTP_PHONE: '8817678133',
      STATIC_OTP: '1234',
      STATIC_OTP_CODE: '1234',
      OTP_EXPIRES_IN_MINUTES: 10,
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      JWT_ACCESS_SECRET: 'test-access-secret-1234567890',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: PersonsService, useValue: {} },
        { provide: MitrasService, useValue: {} },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => configMap[key]),
          },
        },
        { provide: RefreshTokenRepository, useValue: mockRefreshTokenRepository },
        { provide: OtpRepository, useValue: mockOtpRepository },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: WhatsappService, useValue: mockWhatsappService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('Case 1: Demo Account (8817678133 + 1234) -> Generates static OTP 1234, skips SMS, login succeeds', async () => {
    const reqRes = await authService.requestOtp({ phone: '8817678133' });
    expect(reqRes.message).toContain('OTP has been sent successfully');
    expect(smsSentCalls.length).toBe(0); // Real SMS skipped

    const storedOtp = otpStorage.get('8817678133');
    expect(storedOtp?.code).toBe('1234');

    const authRes = await authService.verifyOtp({ phone: '8817678133', code: '1234' });
    expect(authRes.accessToken).toBe('mock-jwt-token');
    expect(authRes.user.firstName).toBe('Demo');
  });

  it('Case 2: Demo Account with wrong OTP (8817678133 + 1111) -> Fails verification', async () => {
    await authService.requestOtp({ phone: '8817678133' });
    await expect(
      authService.verifyOtp({ phone: '8817678133', code: '1111' })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('Case 3: Other User (9876543210) -> Generates random OTP, dispatches real SMS, static OTP 1234 fails', async () => {
    const reqRes = await authService.requestOtp({ phone: '9876543210' });
    expect(reqRes.message).toContain('OTP has been sent successfully');
    expect(smsSentCalls.length).toBe(1);
    expect(smsSentCalls[0].phone).toBe('9876543210');
    expect(smsSentCalls[0].code).toHaveLength(4);

    const generatedCode = smsSentCalls[0].code;
    const storedOtp = otpStorage.get('9876543210');
    expect(storedOtp?.code).toBe(generatedCode);

    // If 1234 is attempted for this other user (and generatedCode is not 1234), verify fails
    if (generatedCode !== '1234') {
      await expect(
        authService.verifyOtp({ phone: '9876543210', code: '1234' })
      ).rejects.toThrow(UnauthorizedException);
    }

    // Verify with actual generated OTP succeeds
    const authRes = await authService.verifyOtp({ phone: '9876543210', code: generatedCode });
    expect(authRes.accessToken).toBe('mock-jwt-token');
  });

  it('Case 4: Static Mode Disabled (STATIC_OTP_MODE=false) -> 8817678133 gets random OTP and SMS is dispatched', async () => {
    configMap['STATIC_OTP_MODE'] = 'false';

    const reqRes = await authService.requestOtp({ phone: '8817678133' });
    expect(reqRes.message).toContain('OTP has been sent successfully');
    expect(smsSentCalls.length).toBe(1); // Real SMS dispatched
    expect(smsSentCalls[0].phone).toBe('8817678133');
    expect(smsSentCalls[0].code).toHaveLength(4);
  });
});
