import { Module } from '@nestjs/common';
import { RoutingController, RoutingTemplatesController } from './routing.controller';
import { RoutingService } from './routing.service';
import { RoutingEvaluatorService } from './routing-evaluator.service';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { ApiKeysModule } from '@/modules/api-keys/api-keys.module';

@Module({
  imports: [AuditLogModule, ApiKeysModule],
  controllers: [RoutingController, RoutingTemplatesController],
  providers: [RoutingService, RoutingEvaluatorService],
  exports: [RoutingService, RoutingEvaluatorService],
})
export class RoutingModule {}
