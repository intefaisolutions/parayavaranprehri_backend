import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { Otp, OtpDocument } from '../schemas/otp.schema';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('SMTP_PORT') ?? 587,
        secure: false,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async sendOtp(email: string, code: string): Promise<void> {
    const from =
      this.configService.get<string>('SMTP_FROM') ?? 'noreply@paryavaran.com';
    const subject = 'Your Paryavaran Login OTP';
    const html = `
      <h2>Paryavaran Platform</h2>
      <p>Your OTP for login is:</p>
      <h1 style="letter-spacing: 8px;">${code}</h1>
      <p>This OTP expires in ${this.configService.get<number>('OTP_EXPIRES_IN_MINUTES')} minutes.</p>
      <p>If you did not request this, please ignore.</p>
    `;

    if (!this.transporter) {
      console.log(`[DEV] OTP for ${email}: ${code}`);
      return;
    }

    await this.transporter.sendMail({ from, to: email, subject, html });
  }
}

@Injectable()
export class OtpRepository {
  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
  ) {}

  async create(email: string, code: string, expiresAt: Date, userId?: string) {
    await this.otpModel.updateMany(
      { email, isUsed: false },
      { isUsed: true },
    );

    return this.otpModel.create({
      email,
      code,
      expiresAt,
      userId,
      isUsed: false,
    });
  }

  async findValid(email: string, code: string): Promise<OtpDocument | null> {
    return this.otpModel
      .findOne({
        email,
        code,
        isUsed: false,
        expiresAt: { $gt: new Date() },
        isDeleted: false,
      })
      .exec();
  }

  async markUsed(id: string): Promise<void> {
    await this.otpModel.findByIdAndUpdate(id, { isUsed: true }).exec();
  }
}
