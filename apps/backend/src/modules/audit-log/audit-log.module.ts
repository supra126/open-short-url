import { Module, Global } from '@nestjs/common';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { DatabaseModule } from '@/common/database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
