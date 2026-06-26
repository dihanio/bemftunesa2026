import { Injectable } from '@nestjs/common';
import { WorkflowDefinition } from '../../../schemas/workflow-definition.schema';
import { ConditionRegistry } from './registries/condition.registry';
import { ActionRegistry } from './registries/action.registry';

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class WorkflowValidatorService {
  constructor(
    private readonly conditionRegistry: ConditionRegistry,
    private readonly actionRegistry: ActionRegistry
  ) {}

  validateDefinition(definition: WorkflowDefinition): WorkflowValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Basic structural checks
    if (!definition.stages || definition.stages.length === 0) {
      errors.push('Workflow must have at least one stage.');
      return { isValid: false, errors, warnings };
    }

    const stageIds = new Set(definition.stages.map(s => s.id));

    // Check for duplicate stage IDs
    if (stageIds.size !== definition.stages.length) {
      errors.push('Duplicate stage IDs found.');
    }

    // 2. Validate transitions
    const transitionIds = new Set<string>();
    const availableConditions = new Set(this.conditionRegistry.getAvailableConditions());
    const availableActions = new Set(this.actionRegistry.getAvailableActions());
    
    for (const t of definition.transitions) {
      if (transitionIds.has(t.id)) {
        errors.push(`Duplicate transition ID: ${t.id}`);
      }
      transitionIds.add(t.id);

      if (t.fromStage && !stageIds.has(t.fromStage)) {
        errors.push(`Transition ${t.id} references non-existent fromStage: ${t.fromStage}`);
      }
      if (!stageIds.has(t.toStage)) {
        errors.push(`Transition ${t.id} references non-existent toStage: ${t.toStage}`);
      }

      // Check condition registry
      for (const cond of t.conditions) {
         if (!availableConditions.has(cond.type)) {
           errors.push(`Transition ${t.id} uses unregistered condition: ${cond.type}`);
         }
      }

      // Check action registry
      if (!availableActions.has(t.action)) {
         warnings.push(`Transition ${t.id} uses unregistered action: ${t.action}. Ensure it is handled before execution.`);
      }
    }

    // 3. Reachability Check (BFS)
    // Assume the stage with the lowest order (or 'draft' if exists) is the entry point
    let entryStage = definition.stages.find(s => s.id === 'draft');
    if (!entryStage) {
      const sortedStages = [...definition.stages].sort((a, b) => a.order - b.order);
      entryStage = sortedStages[0];
    }
    
    if (entryStage) {
      const queue = [entryStage.id];
      const visited = new Set<string>([entryStage.id]);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const outgoing = definition.transitions.filter(t => t.fromStage === current);
        
        for (const out of outgoing) {
          if (!visited.has(out.toStage)) {
            visited.add(out.toStage);
            queue.push(out.toStage);
          }
        }
      }

      // Any stage not visited is unreachable
      for (const id of stageIds) {
        if (!visited.has(id)) {
          errors.push(`Stage ${id} is unreachable from the initial stage (${entryStage.id}).`);
        }
      }
    }

    // 4. Dead end check (Stages with no outgoing transitions)
    for (const id of stageIds) {
      const hasOutgoing = definition.transitions.some(t => t.fromStage === id);
      if (!hasOutgoing) {
        warnings.push(`Stage ${id} is a dead end (no outgoing transitions). Ensure this is a final stage.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
