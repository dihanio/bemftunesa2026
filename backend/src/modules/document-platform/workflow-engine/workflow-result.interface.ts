import { DocumentState } from '../../../schemas/workflow-instance.schema';

export interface WorkflowResult {
  success: boolean;
  message?: string;
  currentState: DocumentState;
  currentStep: number; // For backward compatibility
  nextStageId: string;
  availableActions: string[];
  emittedEvents: string[];
}
