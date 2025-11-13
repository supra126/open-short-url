import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import {
  ApiKeyResponseDto,
  ApiKeyListResponseDto,
} from './dto/api-key-response.dto';
import { ApiKeyQueryDto } from './dto/api-key-query.dto';
import { ERROR_MESSAGES } from '@/common/constants/errors';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate API Key
   */
  private generateApiKey(): { key: string; prefix: string } {
    // Generate 32 bytes random string
    const randomBytes = crypto.randomBytes(32);
    const key = `ak_${randomBytes.toString('hex')}`;
    const prefix = key.substring(0, 12) + '...'; // ak_12345678...

    return { key, prefix };
  }

  /**
   * Hash API Key with bcrypt for secure storage
   */
  private async hashApiKey(key: string): Promise<string> {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    return bcrypt.hash(key, rounds);
  }

  /**
   * Generate SHA-256 hash for fast lookup
   */
  private generateKeyHash(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Validate API Key (optimized version)
   * Use SHA-256 hash for fast lookup, then verify with bcrypt
   * Returns user object with role information for authorization
   */
  async validateApiKey(key: string): Promise<{ id: string; role: string; email: string; isActive: boolean } | null> {
    try {
      // 1. Generate keyHash for fast lookup
      const keyHash = this.generateKeyHash(key);

      // 2. Use indexed keyHash lookup (O(1) lookup) and include user data
      const apiKey = await this.prisma.apiKey.findFirst({
        where: {
          keyHash,
          // Check if expired
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      // 3. If not found, return null immediately
      if (!apiKey) {
        return null;
      }

      // 4. Use bcrypt for secondary verification (prevent SHA-256 collision)
      const isValid = await bcrypt.compare(key, apiKey.key);
      if (!isValid) {
        return null;
      }

      // 5. Check if user account is active
      if (!apiKey.user.isActive) {
        return null;
      }

      // 6. Asynchronously update last used time (non-blocking)
      this.updateLastUsed(apiKey.id).catch((err) => {
        this.logger.error('Failed to update lastUsedAt:', err);
      });

      return {
        id: apiKey.user.id,
        email: apiKey.user.email,
        role: apiKey.user.role,
        isActive: apiKey.user.isActive,
      };
    } catch (error) {
      this.logger.error('API Key validation error:', error);
      return null;
    }
  }

  /**
   * Asynchronously update last used time
   */
  private async updateLastUsed(apiKeyId: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Create API Key
   */
  async create(
    userId: string,
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    // Check API Key quantity limit
    const MAX_API_KEYS_PER_USER = parseInt(
      process.env.MAX_API_KEYS_PER_USER || '10',
      10,
    );
    const existingKeysCount = await this.prisma.apiKey.count({
      where: { userId },
    });

    if (existingKeysCount >= MAX_API_KEYS_PER_USER) {
      throw new ConflictException(
        `Maximum API key limit reached (${MAX_API_KEYS_PER_USER} keys per user)`,
      );
    }

    // Generate API Key
    const { key, prefix } = this.generateApiKey();
    const hashedKey = await this.hashApiKey(key);
    const keyHash = this.generateKeyHash(key);

    // Save to database
    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: createApiKeyDto.name,
        key: hashedKey,
        keyHash,
        prefix,
        userId,
        expiresAt: createApiKeyDto.expiresAt
          ? new Date(createApiKeyDto.expiresAt)
          : null,
      },
    });

    // Return response with full API Key (only this once)
    return {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      key, // Full API Key, only returned on creation
      lastUsedAt: apiKey.lastUsedAt || undefined,
      expiresAt: apiKey.expiresAt || undefined,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    };
  }

  /**
   * Get all API Keys for user with pagination
   */
  async findAll(userId: string, query: ApiKeyQueryDto): Promise<ApiKeyListResponseDto> {
    const { page = 1, pageSize = 10 } = query;
    const skip = (page - 1) * pageSize;

    const [apiKeys, total] = await Promise.all([
      this.prisma.apiKey.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.apiKey.count({ where: { userId } }),
    ]);

    return {
      data: apiKeys.map((apiKey) => ({
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.prefix,
        lastUsedAt: apiKey.lastUsedAt || undefined,
        expiresAt: apiKey.expiresAt || undefined,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get single API Key
   */
  async findOne(id: string, userId: string): Promise<ApiKeyResponseDto> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException(ERROR_MESSAGES.API_KEY_NOT_FOUND);
    }

    return {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      lastUsedAt: apiKey.lastUsedAt || undefined,
      expiresAt: apiKey.expiresAt || undefined,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    };
  }

  /**
   * Delete API Key
   */
  async delete(id: string, userId: string): Promise<void> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException(ERROR_MESSAGES.API_KEY_NOT_FOUND);
    }

    await this.prisma.apiKey.delete({
      where: { id },
    });
  }
}
