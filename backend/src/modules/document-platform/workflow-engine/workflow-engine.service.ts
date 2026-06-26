import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { WorkflowInstanceDocument, WorkflowHistoryEntry, DocumentState } from '../../../schemas/workflow-instance.schema';
import { WorkflowDefinition, WorkflowStage, WorkflowTransition } from '../../../schemas/workflow-definition.schema';
import { ActionRegistry, ActionExecutionContext } from './registries/action.registry';
import { ConditionRegistry, ConditionEvaluationContext } from './registries/condition.registry';
import { WorkflowResult } from './workflow-result.interface';
import { WorkflowEventPayload } from './events/workflow-event.payload';

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    private readonly actionRegistry: ActionRegistry,
    private readonly conditionRegistry: ConditionRegistry,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Executes a workflow action on a document.
   */
  async executeAction(
    actionName: string,
    instance: WorkflowInstanceDocument,
    definition: WorkflowDefinition,
    userId: Types.ObjectId,
    userRoles: string[],
    documentData: any, // Required for condition evaluation
    comment?: string
  ): Promise<WorkflowResult> {
    
    const currentStageId = instance.currentStageId || 'draft';
    const currentStage = definition.stages.find(s => s.id === currentStageId);
    
    if (!currentStage) {
      throw new BadRequestException(`Current stage ${currentStageId} is not defined in the workflow definition.`);
    }

    // 1. Find valid transition
    const validTransitions = definition.transitions.filter(
      t => t.fromStage === currentStageId && t.action === actionName
    );

    if (validTransitions.length === 0) {
      throw new BadRequestException(`Action ${actionName} is not valid for stage ${currentStageId}.`);
    }

    // Since multiple transitions can have the same action (but different conditions), sort by priority
    validTransitions.sort((a, b) => b.priority - a.priority);

    let pickedTransition: WorkflowTransition | null = null;
    let failedReason = '';

    const conditionContext: ConditionEvaluationContext = {
      documentId: instance.documentId.toString(),
      documentType: instance.documentType,
      documentData,
      userId: userId.toString(),
      userRoles,
    };

    // 2. Evaluate conditions for each transition to pick the first one that passes
    for (const transition of validTransitions) {
      let allPassed = true;
      for (const condition of transition.conditions) {
        const evalResult = await this.conditionRegistry.evaluateCondition(condition, conditionContext);
        if (!evalResult.success) {
          allPassed = false;
          failedReason = evalResult.reason || 'Conditions not met';
          break; // Stop evaluating this transition's conditions
        }
      }
      
      if (allPassed) {
        pickedTransition = transition;
        break;
      }
    }

    if (!pickedTransition) {
      throw new ForbiddenException(`Cannot execute action ${actionName}: ${failedReason}`);
    }

    const nextStage = definition.stages.find(s => s.id === pickedTransition!.toStage);
    if (!nextStage) {
      throw new BadRequestException(`Target stage ${pickedTransition.toStage} not found in definition.`);
    }

    // 3. Process Action Execution via Registry
    const actionContext: ActionExecutionContext = {
      instance,
      definition,
      transition: pickedTransition,
      nextStage,
      userId: userId.toString(),
      userRoles,
      comment
    };

    const actionResult = await this.actionRegistry.executeAction(actionName, actionContext);
    
    if (!actionResult.success) {
      throw new BadRequestException(`Action execution failed: ${actionResult.error}`);
    }

    const resolvedNextStageId = actionResult.nextStageId;

    // 4. Update Instance History & Duration
    const now = new Date();
    let durationMinutes = 0;
    
    if (instance.history && instance.history.length > 0) {
      const lastEntry = instance.history[instance.history.length - 1];
      durationMinutes = Math.floor((now.getTime() - new Date(lastEntry.timestamp).getTime()) / 60000);
    }

    let slaStatus = 'on_time';
    if (currentStage.expectedDuration && currentStage.expectedDuration > 0) {
      if (durationMinutes > currentStage.expectedDuration * 60) slaStatus = 'late';
    }

    const newHistoryEntry: WorkflowHistoryEntry = {
      actor: userId,
      action: actionName,
      fromStageId: currentStageId,
      toStageId: resolvedNextStageId,
      fromState: instance.currentState, // Keep legacy if needed
      toState: DocumentState.SUBMITTED, // Legacy override can happen in action handler
      comment: comment || '',
      timestamp: now,
      durationMinutes,
      slaStatus,
    };

    instance.history.push(newHistoryEntry);
    instance.currentStageId = resolvedNextStageId;
    
    // Attempt to map to legacy DocumentState if a mapping exists in Stage metadata
    if (nextStage.metadata?.legacyState) {
      instance.currentState = nextStage.metadata.legacyState as DocumentState;
    }

    // 5. Emit Workflow Event
    const payload: WorkflowEventPayload = {
      workflowId: definition.code,
      workflowVersion: definition.version,
      instanceId: instance._id.toString(),
      documentId: instance.documentId.toString(),
      documentType: instance.documentType,
      action: actionName,
      fromStage: currentStageId,
      toStage: resolvedNextStageId,
      actor: userId.toString(),
      timestamp: now,
      metadata: actionResult.metadata
    };

    this.eventEmitter.emit(`workflow.transitioned`, payload);
    // Also emit specific event name based on the action
    this.eventEmitter.emit(`workflow.action.${actionName.toLowerCase()}`, payload);
    // Also emit specific event name based on the stage entered
    this.eventEmitter.emit(`workflow.stage.${resolvedNextStageId.toLowerCase()}`, payload);

    const emittedEvents = [`workflow.transitioned`, `workflow.action.${actionName.toLowerCase()}`, `workflow.stage.${resolvedNextStageId.toLowerCase()}`];

    return {
      success: true,
      currentState: instance.currentState,
      currentStep: 0,
      nextStageId: resolvedNextStageId,
      availableActions: nextStage.allowedActions || [],
      emittedEvents
    };
  }
}
