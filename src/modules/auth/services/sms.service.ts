import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  /** Strip +91 / 91 / 0 so HSP receives a bare 10-digit Indian mobile. */
  private normalizeMobile(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits.slice(-10);
  }

  /**
   * Exact TRAI/DLT template used by insurance_backend (sender DASSAM).
   * Any other wording is accepted by HSP but dropped by operators.
   * Do NOT put brand names inside `{...}` placeholders in .env.
   */
  private buildOtpMessage(otp: string): string {
    const company =
      this.configService.get<string>('COMPANY_NAME')?.trim() ||
      'Shield Sure Insurance';
    // Exact registered template — keep spaces/punctuation identical
    return `${company} ,Dear User ${otp} is your OTP for login into your account. GGISKB`;
  }

  async sendOtp(phone: string, otp: string): Promise<boolean> {
    const message = this.buildOtpMessage(otp);
    // Log exact SMS body so prod deploy can be verified against DLT template
    this.logger.log(`OTP SMS body: ${message}`);
    return this.sendMessage(phone, message);
  }

  async sendMessage(phone: string, message: string): Promise<boolean> {
    const username = this.configService.get<string>('HSP_SMS_USERNAME');
    const apiKey = this.configService.get<string>('HSP_API_KEY');
    const senderId = this.configService.get<string>('HSP_SMS_SENDER_ID');

    if (!username || !apiKey || !senderId) {
      this.logger.error(
        'SMS gateway is not configured. Missing HSP_SMS_USERNAME / HSP_API_KEY / HSP_SMS_SENDER_ID.',
      );
      return false;
    }

    const mobile = this.normalizeMobile(phone);
    if (mobile.length !== 10) {
      this.logger.error(`Invalid mobile for SMS: ${phone}`);
      return false;
    }

    const encodedMessage = encodeURIComponent(message);
    const url = `http://sms.hspsms.com/sendSMS?username=${encodeURIComponent(
      username,
    )}&message=${encodedMessage}&sendername=${encodeURIComponent(
      senderId,
    )}&smstype=TRANS&numbers=${mobile}&apikey=${encodeURIComponent(apiKey)}`;

    this.logger.log(
      `Sending SMS to ${mobile} via HSP (sender=${senderId})...`,
    );

    try {
      const response = await fetch(url);
      const data = await response.text();
      this.logger.log(`SMS provider response (${response.status}): ${data}`);

      // HSP returns e.g. [{"responseCode":"Message SuccessFully Submitted"},{"msgid":"..."}]
      const isAccepted =
        response.ok &&
        (/success/i.test(data) || /submitted/i.test(data)) &&
        !/error|invalid|fail/i.test(data);

      if (!isAccepted) {
        this.logger.error(
          `[SMS FAILED] Gateway did not accept message to ${mobile}: ${data}`,
        );
        return false;
      }

      this.logger.log(`SMS accepted by gateway for ${mobile}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${mobile}`, error);
      return false;
    }
  }
}
