import { Injectable, Logger } from '@nestjs/common';
import { WorkflowCondition } from '../../../../schemas/workflow-definition.schema';

export interface ConditionEvaluationContext {
  documentId: string;
  documentType: string;
  documentData: any;
  userRoles: string[];
  userId: string;
}

export interface ConditionHandler {
  evaluate(condition: WorkflowCondition, context: ConditionEvaluationContext): Promise<boolean>;
}

@Injectable()
export class ConditionRegistry {
  private readonly logger = new Logger(ConditionRegistry.name);
  private handlers = new Map<string, ConditionHandler>();

  register(type: string, handler: ConditionHandler) {
    if (this.handlers.has(type)) {
      this.logger.warn(`Condition handler for type ${type} is being overwritten.`);
    }
    this.handlers.set(type, handler);
    this.logger.log(`Registered Condition Handler: ${type}`);
  }

  async evaluateCondition(condition: WorkflowCondition, context: ConditionEvaluationContext): Promise<{ success: boolean; reason?: string }> {
    const handler = this.handlers.get(condition.type);
    if (!handler) {
      this.logger.error(`No handler registered for condition type: ${condition.type}`);
      return { success: false, reason: `Unknown condition type: ${condition.type}` };
    }

    try {
      const result = await handler.evaluate(condition, context);
      return { 
        success: result,
        reason: result ? undefined : `Condition ${condition.type} failed`
      };
    } catch (error: any) {
      this.logger.error(`Error evaluating condition ${condition.type}: ${error.message}`);
      return { success: false, reason: `Error evaluating condition: ${error.message}` };
    }
  }

  getAvailableConditions(): string[] {
    return Array.from(this.handlers.keys());
  }
}
