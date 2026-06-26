import { Injectable, Logger } from '@nestjs/common';
import { ConditionRegistry, ConditionEvaluationContext } from './registries/condition.registry';
import { WorkflowDefinition, WorkflowStage, WorkflowTransition } from '../../../schemas/workflow-definition.schema';

export interface SimulatorTrace {
  stageId: string;
  stageName: string;
  actionTaken?: string;
  transitionPicked?: string;
  conditionEvaluations: {
    conditionType: string;
    success: boolean;
    reason?: string;
  }[];
  emittedEvents: string[];
  estimatedDuration: number; // in minutes
}

export interface SimulatorResult {
  success: boolean;
  finalStageId: string;
  totalEstimatedDuration: number; // in minutes
  traces: SimulatorTrace[];
  error?: string;
}

@Injectable()
export class WorkflowSimulatorService {
  private readonly logger = new Logger(WorkflowSimulatorService.name);

  constructor(private readonly conditionRegistry: ConditionRegistry) {}

  /**
   * Simulates a workflow execution given a specific document data and a sequence of expected actions.
   */
  async simulate(
    definition: WorkflowDefinition,
    documentData: any,
    userRolesByStage: Record<string, string[]>, // Map of stageId -> user roles acting in that stage
    actionsSequence: string[] // e.g. ['SUBMIT', 'APPROVE', 'APPROVE']
  ): Promise<SimulatorResult> {
    
    let currentStageId = 'draft';
    if (definition.stages.length > 0 && definition.stages[0].id) {
        // If there's a specific initial stage, we could use it, but typically workflows start in draft
        // Let's assume the first stage is the entry point if not draft
        const draftStage = definition.stages.find(s => s.id === 'draft');
        if (!draftStage) {
            currentStageId = definition.stages[0].id;
        }
    }

    const traces: SimulatorTrace[] = [];
    let totalEstimatedDuration = 0;

    for (const actionName of actionsSequence) {
      const currentStage = definition.stages.find(s => s.id === currentStageId);
      if (!currentStage) {
        return this.errorResult(traces, totalEstimatedDuration, currentStageId, `Stage ${currentStageId} not found`);
      }

      const validTransitions = definition.transitions.filter(
        t => t.fromStage === currentStageId && t.action === actionName
      );

      if (validTransitions.length === 0) {
        return this.errorResult(traces, totalEstimatedDuration, currentStageId, `Action ${actionName} not valid for stage ${currentStageId}`);
      }

      validTransitions.sort((a, b) => b.priority - a.priority);

      let pickedTransition: WorkflowTransition | null = null;
      let failedReason = '';
      const conditionEvaluations: any[] = [];

      const userRoles = userRolesByStage[currentStageId] || ['system_admin'];

      const conditionContext: ConditionEvaluationContext = {
        documentId: 'SIMULATOR',
        documentType: definition.documentType,
        documentData,
        userId: 'SIMULATOR_USER',
        userRoles,
      };

      for (const transition of validTransitions) {
        let allPassed = true;
        for (const condition of transition.conditions) {
          const evalResult = await this.conditionRegistry.evaluateCondition(condition, conditionContext);
          conditionEvaluations.push({
            conditionType: condition.type,
            success: evalResult.success,
            reason: evalResult.reason
          });

          if (!evalResult.success) {
            allPassed = false;
            failedReason = evalResult.reason || 'Conditions not met';
            break;
          }
        }
        
        if (allPassed) {
          pickedTransition = transition;
          break;
        }
      }

      const stageDuration = currentStage.expectedDuration ? currentStage.expectedDuration * 60 : 0;
      totalEstimatedDuration += stageDuration;

      if (!pickedTransition) {
        traces.push({
            stageId: currentStageId,
            stageName: currentStage.name,
            actionTaken: actionName,
            conditionEvaluations,
            emittedEvents: [],
            estimatedDuration: stageDuration
        });
        return this.errorResult(traces, totalEstimatedDuration, currentStageId, `Cannot execute action ${actionName}: ${failedReason}`);
      }

      const nextStage = definition.stages.find(s => s.id === pickedTransition!.toStage);
      
      const emittedEvents = [
          `workflow.transitioned`, 
          `workflow.action.${actionName.toLowerCase()}`, 
          `workflow.stage.${pickedTransition.toStage.toLowerCase()}`
      ];

      traces.push({
        stageId: currentStageId,
        stageName: currentStage.name,
        actionTaken: actionName,
        transitionPicked: pickedTransition.name || pickedTransition.id,
        conditionEvaluations,
        emittedEvents,
        estimatedDuration: stageDuration
      });

      currentStageId = pickedTransition.toStage;
    }

    return {
      success: true,
      finalStageId: currentStageId,
      totalEstimatedDuration,
      traces
    };
  }

  private errorResult(traces: SimulatorTrace[], totalEstimatedDuration: number, finalStageId: string, error: string): SimulatorResult {
    return {
      success: false,
      finalStageId,
      totalEstimatedDuration,
      traces,
      error
    };
  }
}
