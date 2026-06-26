import { Injectable } from '@nestjs/common';
import { ConditionHandler, ConditionEvaluationContext } from '../registries/condition.registry';
import { WorkflowCondition } from '../../../../schemas/workflow-definition.schema';

@Injectable()
export class RoleConditionHandler implements ConditionHandler {
  async evaluate(condition: WorkflowCondition, context: ConditionEvaluationContext): Promise<boolean> {
    const config = condition.configuration as { allowedRoles: string[] };
    if (!config || !config.allowedRoles || config.allowedRoles.length === 0) {
      return true; // No roles defined = anyone can perform
    }

    return context.userRoles.some(role => config.allowedRoles.includes(role));
  }
}
