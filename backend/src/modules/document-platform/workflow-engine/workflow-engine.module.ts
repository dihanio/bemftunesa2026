import { Module, Global } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import { AuthorizationService } from './authorization.service';
import { ActionRegistry } from './registries/action.registry';
import { ConditionRegistry } from './registries/condition.registry';
import { DefaultActionHandler } from './actions/default.action';
import { RoleConditionHandler } from './conditions/role.condition';
import { WorkflowRegistryInitializer } from './workflow-registry.initializer';
import { WorkflowSimulatorService } from './workflow-simulator.service';
import { WorkflowValidatorService } from './workflow-validator.service';
import { WorkflowEventSubscriber } from './events/workflow-event.subscriber';

@Global()
@Module({
  providers: [
    WorkflowEngineService, 
    AuthorizationService,
    ActionRegistry,
    ConditionRegistry,
    DefaultActionHandler,
    RoleConditionHandler,
    WorkflowRegistryInitializer,
    WorkflowSimulatorService,
    WorkflowValidatorService,
    WorkflowEventSubscriber
  ],
  exports: [
    WorkflowEngineService, 
    AuthorizationService,
    ActionRegistry,
    ConditionRegistry,
    WorkflowSimulatorService,
    WorkflowValidatorService
  ],
})
export class WorkflowEngineModule {}
