/**
 * Cloudflare Turnstile Verification Service
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly secretKey: string;
  private readonly verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('TURNSTILE_SECRET_KEY')!;
    const siteKey = this.configService.get<string>('TURNSTILE_SITE_KEY');

    if (!this.secretKey || !siteKey) {
      this.logger.warn(
        'Turnstile is not fully configured (missing SECRET_KEY or SITE_KEY). ' +
        'Turnstile verification will be skipped. Set both TURNSTILE_SECRET_KEY and TURNSTILE_SITE_KEY to enable.'
      );
    }
  }

  /**
   * Verify Turnstile token
   * @param token - Turnstile token from client (optional)
   * @param remoteIp - Client IP address (optional but recommended)
   * @returns true if verification successful, false otherwise
   */
  async verify(token: string | undefined, remoteIp?: string): Promise<boolean> {
    // If no secret key configured, skip verification (development environment)
    if (!this.secretKey) {
      this.logger.debug('Turnstile verification skipped - no secret key configured');
      return true;
    }

    // If secret key is configured but token is missing, reject
    if (!token) {
      this.logger.warn('Turnstile token is required but was not provided');
      return false;
    }

    try {
      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: this.secretKey,
          response: token,
          remoteip: remoteIp,
        }),
      });

      const data: TurnstileVerifyResponse = await response.json();

      if (!data.success) {
        this.logger.warn(`Turnstile verification failed: ${JSON.stringify(data['error-codes'])}`);
        return false;
      }

      this.logger.log('Turnstile verification successful');
      return true;
    } catch (error) {
      this.logger.error('Turnstile verification error:', error);
      return false;
    }
  }

  /**
   * Verify Turnstile token or throw exception
   * @param token - Turnstile token from client (optional)
   * @param remoteIp - Client IP address (optional but recommended)
   * @throws UnauthorizedException if verification fails
   */
  async verifyOrThrow(token: string | undefined, remoteIp: string | undefined): Promise<void> {
    const isValid = await this.verify(token, remoteIp);

    if (!isValid) {
      throw new UnauthorizedException('Security verification failed, please try again');
    }
  }
}
