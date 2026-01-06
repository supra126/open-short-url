import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyQueryDto } from './dto/api-key-query.dto';
import {
  ApiKeyResponseDto,
  CreateApiKeyResponseDto,
  ApiKeyListResponseDto,
} from './dto/api-key-response.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequestMeta, RequestMeta as RequestMetaType } from '@/common/decorators/request-meta.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { IUserFromToken } from '@/common/interfaces/user.interface';

@ApiTags('API Keys')
@Controller('api/api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * Create API Key
   */
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({
    summary: 'Create API Key',
    description: 'Create a new API Key for the current user. Rate limited to 5 requests per minute.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'API Key created successfully',
    type: CreateApiKeyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests. Please try again later.',
    type: ErrorResponseDto,
  })
  async create(
    @CurrentUser() user: IUserFromToken,
    @Body() createApiKeyDto: CreateApiKeyDto,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<CreateApiKeyResponseDto> {
    return this.apiKeysService.create(user.id, createApiKeyDto, meta);
  }

  /**
   * Get all API Keys with pagination
   */
  @Get()
  @ApiOperation({
    summary: 'Get all API Keys',
    description: 'Retrieve all API Keys for the current user with pagination support',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
    type: ApiKeyListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findAll(
    @CurrentUser() user: IUserFromToken,
    @Query() query: ApiKeyQueryDto,
  ): Promise<ApiKeyListResponseDto> {
    return this.apiKeysService.findAll(user.id, query);
  }

  /**
   * Get single API Key
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get single API Key',
    description: 'Retrieve API Key details by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'API Key ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'API Key not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findOne(
    @CurrentUser() user: IUserFromToken,
    @Param('id') id: string,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.findOne(id, user.id);
  }

  /**
   * Delete API Key
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete API Key',
    description: 'Delete the specified API Key',
  })
  @ApiParam({
    name: 'id',
    description: 'API Key ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'API Key not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async delete(
    @CurrentUser() user: IUserFromToken,
    @Param('id') id: string,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<void> {
    return this.apiKeysService.delete(id, user.id, meta);
  }
}
