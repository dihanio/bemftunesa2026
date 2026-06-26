import { Injectable, OnModuleInit } from '@nestjs/common';
import { ActionRegistry } from './registries/action.registry';
import { ConditionRegistry } from './registries/condition.registry';
import { DefaultActionHandler } from './actions/default.action';
import { RoleConditionHandler } from './conditions/role.condition';

@Injectable()
export class WorkflowRegistryInitializer implements OnModuleInit {
  constructor(
    private readonly actionRegistry: ActionRegistry,
    private readonly conditionRegistry: ConditionRegistry,
    private readonly defaultActionHandler: DefaultActionHandler,
    private readonly roleConditionHandler: RoleConditionHandler,
  ) {}

  onModuleInit() {
    // Register Actions
    this.actionRegistry.register('SUBMIT', this.defaultActionHandler);
    this.actionRegistry.register('APPROVE', this.defaultActionHandler);
    this.actionRegistry.register('REJECT', this.defaultActionHandler);
    this.actionRegistry.register('REQUEST_REVISION', this.defaultActionHandler);
    this.actionRegistry.register('RETURN', this.defaultActionHandler);
    this.actionRegistry.register('CANCEL', this.defaultActionHandler);
    this.actionRegistry.register('PUBLISH', this.defaultActionHandler);
    this.actionRegistry.register('ARCHIVE', this.defaultActionHandler);

    // Register Conditions
    this.conditionRegistry.register('RoleCondition', this.roleConditionHandler);
  }
}
