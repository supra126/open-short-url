import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { TurnstileModule } from '../turnstile/turnstile.module';
import { CacheModule } from '@/common/cache/cache.module';

@Module({
  imports: [
    PassportModule,
    TurnstileModule,
    CacheModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');

        // List of unsafe default values
        const unsafeSecrets = [
          'default-secret',
          'your-super-secret-jwt-key-change-in-production',
          'change-me',
          'secret',
          'jwt-secret',
        ];

        // Check if JWT_SECRET exists
        if (!jwtSecret) {
          throw new Error(
            '❌ SECURITY ERROR: JWT_SECRET is not configured in environment variables. ' +
            'Please set a strong, random JWT_SECRET in your .env file. ' +
            'You can generate one using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
          );
        }

        // Check if using unsafe default values
        if (unsafeSecrets.includes(jwtSecret)) {
          throw new Error(
            `❌ SECURITY ERROR: JWT_SECRET is using an unsafe default value: "${jwtSecret}". ` +
            'Please set a strong, random JWT_SECRET in your .env file. ' +
            'You can generate one using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
          );
        }

        // Check JWT_SECRET length (minimum 32 characters)
        if (jwtSecret.length < 32) {
          throw new Error(
            `❌ SECURITY ERROR: JWT_SECRET is too short (${jwtSecret.length} characters). ` +
            'It must be at least 32 characters long for security. ' +
            'You can generate a secure one using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
          );
        }

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: '7d', // Default: 7 days
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenBlacklistService],
  exports: [AuthService, TokenBlacklistService],
})
export class AuthModule {}
