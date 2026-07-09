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
    const message = encodeURIComponent(`Your Paryavaran Prahri Admin Login OTP is ${otp}. Please do not share this code.`);
    
    // NOTE: This is a standard HSP SMS API URL structure. 
    // If the provider has a different base URL (like https://api.msg91.com or similar), it can be updated here.
    const url = `http://sms.hspsms.com/sendSMS?username=${username}&message=${message}&sendername=${senderId}&smstype=TRANS&numbers=${phone}&apikey=${apiKey}`;
    
    this.logger.log(`Attempting to send OTP SMS to ${phone} via HSP API...`);
    
    try {
      // Uncomment the fetch call below to actually hit the live API
      /*
      const response = await fetch(url);
      const data = await response.text();
      this.logger.log(`SMS Provider Response: ${data}`);
      */
      
      this.logger.log(`[MOCK SUCCESS] OTP SMS sent successfully to ${phone} with OTP ${otp}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}`, error);
      return false;
    }
  }
}
