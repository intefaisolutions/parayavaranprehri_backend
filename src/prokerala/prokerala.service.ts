import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ProkeralaKundliResponse {
  status: string;
  data: {
    nakshatra_details?: {
      nakshatra?: {
        name: string;
      };
      chandra_rasi?: {
        id: number;
        name: string;
      };
      soorya_rasi?: {
        name: string;
      };
      zodiac?: {
        name: string;
      };
    };
  };
}

@Injectable()
export class ProkeralaService {
  private readonly logger = new Logger(ProkeralaService.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>('PROKERALA_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PROKERALA_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException('Prokerala credentials are not configured');
    }

    this.logger.debug('Fetching new Prokerala OAuth token');

    try {
      const response = await fetch('https://api.prokerala.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Prokerala token error: ${errText}`);
        throw new InternalServerErrorException('Failed to authenticate with Prokerala');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      // Token expires in data.expires_in seconds (usually 3600). We buffer by 60 seconds.
      const expiresIn = (data.expires_in || 3600) - 60; 
      const expiry = new Date();
      expiry.setSeconds(expiry.getSeconds() + expiresIn);
      this.tokenExpiry = expiry;

      return this.accessToken as string;
    } catch (error) {
      this.logger.error('Error fetching Prokerala token', error);
      throw new InternalServerErrorException('Error authenticating with Prokerala');
    }
  }

  async getKundli(latitude: number, longitude: number, datetime: string): Promise<ProkeralaKundliResponse> {
    const token = await this.getAccessToken();
    const ayanamsa = '1'; // 1 = Lahiri
    
    // Construct the query
    const params = new URLSearchParams({
      ayanamsa,
      coordinates: `${latitude},${longitude}`,
      datetime, // Should be ISO-8601 string including timezone
    });

    const url = `https://api.prokerala.com/v2/astrology/kundli?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Prokerala Kundli API error: ${errText}`);
        throw new InternalServerErrorException('Failed to calculate Janma Rashi');
      }

      const data = (await response.json()) as ProkeralaKundliResponse;
      return data;
    } catch (error) {
      this.logger.error('Error fetching Kundli from Prokerala', error);
      throw new InternalServerErrorException('Failed to fetch Kundli from Prokerala');
    }
  }
}
