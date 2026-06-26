import { Injectable, Logger } from '@nestjs/common';
import { WorkflowInstanceDocument, WorkflowHistoryEntry } from '../../../../schemas/workflow-instance.schema';
import { WorkflowDefinition, WorkflowTransition, WorkflowStage } from '../../../../schemas/workflow-definition.schema';

export interface ActionExecutionContext {
  instance: WorkflowInstanceDocument;
  definition: WorkflowDefinition;
  transition: WorkflowTransition;
  nextStage: WorkflowStage;
  userId: string;
  userRoles: string[];
  comment?: string;
}

export interface ActionHandler {
  execute(context: ActionExecutionContext): Promise<{ success: boolean; nextStageId: string; metadata?: any; error?: string }>;
}

@Injectable()
export class ActionRegistry {
  private readonly logger = new Logger(ActionRegistry.name);
  private handlers = new Map<string, ActionHandler>();

  register(actionName: string, handler: ActionHandler) {
    if (this.handlers.has(actionName)) {
      this.logger.warn(`Action handler for type ${actionName} is being overwritten.`);
    }
    this.handlers.set(actionName, handler);
    this.logger.log(`Registered Action Handler: ${actionName}`);
  }

  async executeAction(actionName: string, context: ActionExecutionContext): Promise<{ success: boolean; nextStageId: string; metadata?: any; error?: string }> {
    const handler = this.handlers.get(actionName);
    
    if (!handler) {
      this.logger.error(`No handler registered for action: ${actionName}`);
      // Default behavior if no specific handler is registered: just transition to next state
      return { success: true, nextStageId: context.nextStage.id };
    }

    try {
      return await handler.execute(context);
    } catch (error: any) {
      this.logger.error(`Error executing action ${actionName}: ${error.message}`);
      return { success: false, nextStageId: context.instance.currentStageId, error: error.message };
    }
  }

  getAvailableActions(): string[] {
    return Array.from(this.handlers.keys());
  }
}
