import { Body, Controller, Headers, Ip, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import {
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  refreshTokenSchema,
} from './dto/auth.dto';
import type {
  LoginDto,
  OtpRequestDto,
  OtpVerifyDto,
  RefreshTokenDto,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Email & password login' })
  login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    return this.authService.login(dto, userAgent, ip);
  }

  @Public()
  @Post('otp/request')
  @ApiOperation({ summary: 'Request OTP for email login' })
  requestOtp(
    @Body(new ZodValidationPipe(otpRequestSchema)) dto: OtpRequestDto,
  ) {
    return this.authService.requestOtp(dto);
  }

  @Public()
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and login' })
  verifyOtp(
    @Body(new ZodValidationPipe(otpVerifySchema)) dto: OtpVerifyDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    return this.authService.verifyOtp(dto, userAgent, ip);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema)) dto: RefreshTokenDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    return this.authService.refresh(dto.refreshToken, userAgent, ip);
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  logout(
    @Body(new ZodValidationPipe(refreshTokenSchema)) dto: RefreshTokenDto,
  ) {
    return this.authService.logout(dto.refreshToken);
  }
}
