import { Injectable } from '@nestjs/common';
import { ActionHandler, ActionExecutionContext } from '../registries/action.registry';

@Injectable()
export class DefaultActionHandler implements ActionHandler {
  async execute(context: ActionExecutionContext): Promise<{ success: boolean; nextStageId: string; metadata?: any; error?: string }> {
    // In Phase 6, a standard transition simply moves the document to the target stage.
    // Business logic related to state change is handled by the Stage metadata (e.g. legacyState mapping)
    // or through decoupled event subscribers reacting to `workflow.transitioned`.
    
    return {
      success: true,
      nextStageId: context.nextStage.id,
      metadata: {
        comment: context.comment
      }
    };
  }
}
