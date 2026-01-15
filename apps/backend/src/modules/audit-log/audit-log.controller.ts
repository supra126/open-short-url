import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogListResponseDto } from './dto/audit-log-response.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Audit Logs')
@Controller('api/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Get audit logs with pagination and filtering
   * Admin only
   */
  @Get()
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieve audit logs with pagination and filtering. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
    type: AuditLogListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin access required',
    type: ErrorResponseDto,
  })
  async getAuditLogs(
    @Query() queryDto: AuditLogQueryDto,
  ): Promise<AuditLogListResponseDto> {
    return this.auditLogService.findAll(queryDto);
  }
}
