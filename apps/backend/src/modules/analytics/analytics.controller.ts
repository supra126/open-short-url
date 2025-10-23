import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import {
  AnalyticsResponseDto,
  RecentClicksResponseDto,
} from './dto/analytics-response.dto';
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('Analytics')
@Controller('api/analytics')
@UseGuards(JwtOrApiKeyAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get analytics for a single URL
   */
  @Get('urls/:id')
  @ApiOperation({
    summary: 'Get analytics for a single URL',
    description: 'Retrieve detailed analytics data for the specified URL, including click trends, geographic locations, device distribution, etc.',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
    type: AnalyticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'URL not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getUrlAnalytics(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query() queryDto: AnalyticsQueryDto,
  ): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getUrlAnalytics(id, user.id, queryDto);
  }

  /**
   * Get analytics for all user URLs
   */
  @Get('overview')
  @ApiOperation({
    summary: 'Get analytics for all user URLs',
    description: 'Retrieve comprehensive analytics data for all short URLs of the current user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
    type: AnalyticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getUserAnalytics(
    @CurrentUser() user: any,
    @Query() queryDto: AnalyticsQueryDto,
  ): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getUserAnalytics(user.id, queryDto);
  }

  /**
   * Get recent clicks for a URL
   */
  @Get('urls/:id/recent-clicks')
  @ApiOperation({
    summary: 'Get recent clicks for a URL',
    description: 'Retrieve the most recent click records for the specified URL',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
    type: RecentClicksResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'URL not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getRecentClicks(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('includeBots') includeBots?: string,
  ): Promise<RecentClicksResponseDto> {
    return this.analyticsService.getRecentClicks(
      id,
      user.id,
      limit ? Number(limit) : 20,
      includeBots === 'true',
    );
  }

  /**
   * Get bot analytics for a URL
   */
  @Get('urls/:id/bots')
  @ApiOperation({
    summary: 'Get bot analytics for a URL',
    description: 'Retrieve bot traffic statistics for the specified URL',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'URL not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getBotAnalytics(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query() queryDto: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getBotAnalytics(id, user.id, queryDto);
  }

  /**
   * Get bot analytics for all user URLs
   */
  @Get('bots')
  @ApiOperation({
    summary: 'Get bot analytics for all user URLs',
    description: 'Retrieve overall bot traffic statistics across all URLs of the current user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getUserBotAnalytics(
    @CurrentUser() user: any,
    @Query() queryDto: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getUserBotAnalytics(user.id, queryDto);
  }

  /**
   * Get A/B Testing analytics for all user URLs
   */
  @Get('ab-tests')
  @ApiOperation({
    summary: 'Get A/B Testing analytics for all user URLs',
    description: 'Retrieve overall A/B Testing statistics across all URLs with testing enabled',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getUserAbTestAnalytics(
    @CurrentUser() user: any,
    @Query() queryDto: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getUserAbTestAnalytics(user.id, queryDto);
  }
}
