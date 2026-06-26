import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkflowDefinition, WorkflowDefinitionSchema } from '../../../schemas/workflow-definition.schema';
import { WorkflowInstance, WorkflowInstanceSchema } from '../../../schemas/workflow-instance.schema';
import { WorkflowManagementController } from './workflow-management.controller';
import { WorkflowManagementService } from './workflow-management.service';
import { WorkflowEngineModule } from '../workflow-engine/workflow-engine.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkflowDefinition.name, schema: WorkflowDefinitionSchema },
      { name: WorkflowInstance.name, schema: WorkflowInstanceSchema }
    ]),
    WorkflowEngineModule
  ],
  controllers: [WorkflowManagementController],
  providers: [WorkflowManagementService],
})
export class WorkflowManagementModule {}
