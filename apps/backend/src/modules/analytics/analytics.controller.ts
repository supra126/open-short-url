import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { FastifyReply } from 'fastify';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { ExportQueryDto, ExportFormat } from './dto/export-query.dto';
import {
  AnalyticsResponseDto,
  RecentClicksResponseDto,
  BotAnalyticsResponseDto,
  UserBotAnalyticsResponseDto,
  AbTestAnalyticsResponseDto,
} from './dto/analytics-response.dto';
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('Analytics')
@Controller('api/analytics')
@UseGuards(JwtOrApiKeyAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiSecurity('API-Key')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly exportService: ExportService,
  ) {}

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
    @CurrentUser() user: User,
    @Query() queryDto: AnalyticsQueryDto,
  ): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getUrlAnalytics(id, user, queryDto);
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
    @CurrentUser() user: User,
    @Query() queryDto: AnalyticsQueryDto,
  ): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getUserAnalytics(user, queryDto);
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
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
    @Query('includeBots') includeBots?: string,
  ): Promise<RecentClicksResponseDto> {
    return this.analyticsService.getRecentClicks(
      id,
      user,
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
    type: BotAnalyticsResponseDto,
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
    @CurrentUser() user: User,
    @Query() queryDto: AnalyticsQueryDto,
  ): Promise<BotAnalyticsResponseDto> {
    return this.analyticsService.getBotAnalytics(id, user, queryDto);
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
    type: UserBotAnalyticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getUserBotAnalytics(
    @CurrentUser() user: User,
    @Query() queryDto: AnalyticsQueryDto,
  ): Promise<UserBotAnalyticsResponseDto> {
    return this.analyticsService.getUserBotAnalytics(user, queryDto);
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
    type: AbTestAnalyticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getUserAbTestAnalytics(
    @CurrentUser() user: User,
    @Query() queryDto: AnalyticsQueryDto,
  ): Promise<AbTestAnalyticsResponseDto> {
    return this.analyticsService.getUserAbTestAnalytics(user, queryDto);
  }

  /**
   * Export analytics for a single URL
   */
  @Get('urls/:id/export')
  @ApiOperation({
    summary: 'Export analytics for a single URL',
    description: 'Export analytics data as CSV or JSON for the specified URL',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiProduces('text/csv', 'application/json')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export successful',
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
  async exportUrlAnalytics(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query() queryDto: ExportQueryDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const { analytics, clicks, urlSlug, dateRange } = await this.analyticsService.getExportData(
      id,
      user,
      queryDto,
    );

    const exportData = {
      analytics,
      clicks: queryDto.includeClicks ? clicks : undefined,
      urlSlug,
      dateRange,
      exportedAt: new Date().toISOString(),
    };

    const format = queryDto.format || ExportFormat.CSV;
    const filename = this.exportService.generateFilename(
      urlSlug,
      format,
      dateRange.startDate,
      dateRange.endDate,
    );

    if (format === ExportFormat.CSV) {
      const csv = this.exportService.formatToCSV(exportData);
      reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv);
    } else {
      const json = this.exportService.formatToJSON(exportData);
      reply
        .header('Content-Type', 'application/json; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(json);
    }
  }

  /**
   * Export analytics for all user URLs
   */
  @Get('export')
  @ApiOperation({
    summary: 'Export analytics for all user URLs',
    description: 'Export comprehensive analytics data as CSV or JSON for all URLs of the current user',
  })
  @ApiProduces('text/csv', 'application/json')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async exportUserAnalytics(
    @CurrentUser() user: User,
    @Query() queryDto: ExportQueryDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const { analytics, dateRange } = await this.analyticsService.getUserExportData(user, queryDto);

    const exportData = {
      analytics,
      dateRange,
      exportedAt: new Date().toISOString(),
    };

    const format = queryDto.format || ExportFormat.CSV;
    const filename = this.exportService.generateFilename(
      undefined,
      format,
      dateRange.startDate,
      dateRange.endDate,
    );

    if (format === ExportFormat.CSV) {
      const csv = this.exportService.formatToCSV(exportData);
      reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv);
    } else {
      const json = this.exportService.formatToJSON(exportData);
      reply
        .header('Content-Type', 'application/json; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(json);
    }
  }
}
