import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOtp(phone: string, otp: string): Promise<boolean> {
    const username = this.configService.get<string>('HSP_SMS_USERNAME');
    const password = this.configService.get<string>('HSP_SMS_PASSWORD');
    const apiKey = this.configService.get<string>('HSP_API_KEY');
    const senderId = this.configService.get<string>('HSP_SMS_SENDER_ID');

    // The message that the user will receive
    const message = encodeURIComponent(
      `Your Paryavaran Prahri Admin Login OTP is ${otp}. Please do not share this code.`,
    );

    // NOTE: This is a standard HSP SMS API URL structure.
    // If the provider has a different base URL (like https://api.msg91.com or similar), it can be updated here.
    const url = `http://sms.hspsms.com/sendSMS?username=${username}&message=${message}&sendername=${senderId}&smstype=TRANS&numbers=${phone}&apikey=${apiKey}`;

    console.log('--- SMS DEBUG INFO ---');
    console.log('USERNAME:', username);
    console.log('API_KEY:', apiKey);
    console.log('SENDER_ID:', senderId);
    console.log('URL:', url);
    console.log('----------------------');

    this.logger.log(`Attempting to send OTP SMS to ${phone} via HSP API...`);

    try {
      const response = await fetch(url);
      const data = await response.text();

      console.log('--- SMS RESPONSE ---');
      console.log('STATUS:', response.status);
      console.log('DATA:', data);
      console.log('--------------------');

      this.logger.log(`SMS Provider Response: ${data}`);

      this.logger.log(
        `[LIVE SUCCESS] OTP SMS sent successfully to ${phone} with OTP ${otp}`,
      );
      return true;
    } catch (error) {
      console.error('--- SMS ERROR ---');
      console.error(error);
      console.error('-----------------');
      this.logger.error(`Failed to send SMS to ${phone}`, error);
      return false;
    }
  }
}
