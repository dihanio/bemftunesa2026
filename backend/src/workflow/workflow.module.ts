import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from '../audit/audit.module';
import { PermissionsModule } from '../permissions/permissions.module';
import {
  WorkflowDefinitionRecord,
  WorkflowDefinitionSchema,
  WorkflowInstanceRecord,
  WorkflowInstanceSchema,
} from '../database/schema/security';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [
    AuditModule,
    PermissionsModule,
    MongooseModule.forFeature([
      {
        name: WorkflowDefinitionRecord.name,
        schema: WorkflowDefinitionSchema,
      },
      {
        name: WorkflowInstanceRecord.name,
        schema: WorkflowInstanceSchema,
      },
    ]),
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
