import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { UserRepository } from '../users/repositories/user.repository';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import {
  AuthResponse,
  LoginDto,
  OtpRequestDto,
  OtpVerifyDto,
  TokenPair,
} from './dto/auth.dto';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { EmailService, OtpRepository } from './services/email.service';
import { SmsService } from './services/sms.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly otpRepository: OtpRepository,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private buildPayload(user: UserDocument): JwtPayload {
    return {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions ?? [],
    };
  }

  private async generateTokens(
    user: UserDocument,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenPair> {
    const payload = this.buildPayload(user);
    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = randomBytes(64).toString('hex');
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const expiresAt = this.parseExpiry(refreshExpiresIn);

    await this.refreshTokenRepository.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
      userAgent,
      ipAddress,
    } as never);

    return { accessToken, refreshToken, expiresIn: accessExpiresIn };
  }

  private parseExpiry(expiry: string): Date {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * (multipliers[unit] ?? multipliers.d));
  }

  private buildAuthResponse(
    user: UserDocument,
    tokens: TokenPair,
  ): AuthResponse {
    return {
      ...tokens,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions ?? [],
      },
    };
  }

  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'Password login not available. Use OTP login.',
      );
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user._id.toString());
    const tokens = await this.generateTokens(user, userAgent, ipAddress);

    return this.buildAuthResponse(user, tokens);
  }

  async requestOtp(dto: OtpRequestDto): Promise<{ message: string }> {
    const identifier = dto.email || dto.phone;
    if (!identifier) {
      throw new UnauthorizedException('Email or phone must be provided');
    }

    const user = dto.email
      ? await this.usersService.findByEmail(dto.email)
      : await this.usersService.findByPhone(dto.phone!);

    if (!user || !user.isActive) {
      return { message: 'If the account exists, an OTP has been sent' };
    }

    const code = this.generateOtp();
    const expiresMinutes =
      this.configService.get<number>('OTP_EXPIRES_IN_MINUTES') ?? 10;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    await this.otpRepository.create(
      identifier,
      code,
      expiresAt,
      user._id.toString(),
    );

    if (dto.phone) {
      await this.smsService.sendOtp(dto.phone, code);
    } else if (dto.email) {
      await this.emailService.sendOtp(dto.email, code);
    }

    return { message: 'If the account exists, an OTP has been sent' };
  }

  async verifyOtp(
    dto: OtpVerifyDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    const identifier = dto.email || dto.phone;
    if (!identifier) {
      throw new UnauthorizedException('Email or phone must be provided');
    }

    const otp = await this.otpRepository.findValid(identifier, dto.code);

    if (!otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = dto.email
      ? await this.usersService.findByEmail(dto.email)
      : await this.usersService.findByPhone(dto.phone!);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.otpRepository.markUsed(otp._id.toString());
    await this.usersService.updateLastLogin(user._id.toString());

    const tokens = await this.generateTokens(user, userAgent, ipAddress);

    return this.buildAuthResponse(user, tokens);
  }

  async refresh(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenPair> {
    const stored = await this.refreshTokenRepository.findByToken(refreshToken);

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userDoc = await this.userRepository.findById(
      stored.userId.toString(),
    );

    if (!userDoc || !userDoc.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.refreshTokenRepository.revokeToken(refreshToken);

    return this.generateTokens(userDoc, userAgent, ipAddress);
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.refreshTokenRepository.revokeToken(refreshToken);
    return { message: 'Logged out successfully' };
  }
}
