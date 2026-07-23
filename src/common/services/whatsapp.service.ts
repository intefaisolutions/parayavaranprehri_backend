import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WhatsappAttachments {
  imageUrl?: string;
  pdfUrl?: string;
}

export interface WhatsappSendResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl = 'http://wapp.hspsms.com/wapp/api/send/json';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Normalizes an Indian mobile number to a bare 10-digit string
   * (strips leading +91 / 91 / 0 if present).
   */
  private normalizeMobile(mobile: string): string {
    const digits = mobile.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.slice(1);
    }
    return digits;
  }

  async sendMessage(
    mobile: string,
    message: string,
    attachments: WhatsappAttachments = {},
  ): Promise<WhatsappSendResult> {
    const apiKey = this.configService.get<string>('HSP_WHATSAPP_API_KEY');

    if (!apiKey) {
      this.logger.error(
        'WhatsApp gateway is not configured. Missing HSP_WHATSAPP_API_KEY.',
      );
      return { success: false, error: 'WhatsApp gateway is not configured' };
    }

    const normalizedMobile = this.normalizeMobile(mobile);
    if (normalizedMobile.length !== 10) {
      return { success: false, error: `Invalid mobile number: ${mobile}` };
    }

    const mediaAttachments: Record<string, string> = {};
    if (attachments.imageUrl) {
      mediaAttachments.img1 = attachments.imageUrl;
    }
    if (attachments.pdfUrl) {
      mediaAttachments.pdf = attachments.pdfUrl;
    }

    const payload = {
      mobile: `91${normalizedMobile}`,
      msg: message,
      ...mediaAttachments,
    };

    this.logger.log(
      `Attempting to send WhatsApp message to ${normalizedMobile} via HSP API...`,
    );

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      this.logger.log(`WhatsApp Provider Response: ${JSON.stringify(data)}`);

      const isSent =
        response.ok &&
        (data?.status === 'success' || /success/i.test(JSON.stringify(data)));

      if (!isSent) {
        const error = data?.message || JSON.stringify(data) || 'Unknown error';
        this.logger.error(
          `[WHATSAPP FAILED] Gateway did not confirm delivery to ${normalizedMobile}: ${error}`,
        );
        return { success: false, error };
      }

      this.logger.log(
        `[WHATSAPP SUCCESS] Message sent successfully to ${normalizedMobile}`,
      );
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send WhatsApp message to ${mobile}`, error);
      return { success: false, error: message };
    }
  }
}
