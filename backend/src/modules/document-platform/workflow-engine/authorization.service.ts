import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { DocumentState } from '../../../schemas/workflow-instance.schema';
import { WorkflowStage } from '../../../schemas/workflow-definition.schema';

@Injectable()
export class AuthorizationService {
  /**
   * Checks if a specific user can perform an action on a document in a certain state and step.
   * Note: In Phase 6, action execution is primarily guarded by Transition Conditions (e.g. RoleCondition).
   * This method serves as a general fallback or UI helper.
   */
  async canPerformAction(
    userId: string | Types.ObjectId,
    userRoles: string[],
    action: string,
    currentState: DocumentState,
    currentStage: WorkflowStage | null
  ): Promise<boolean> {
    
    // Default system logic:
    if (action === 'SUBMIT' && currentState === DocumentState.DRAFT) {
      return true;
    }

    if (currentStage && currentStage.assignedRole && currentStage.assignedRole.length > 0) {
      // Check if any of the user's roles match the authorized roles for this step
      const hasAuthorizedRole = userRoles.some(role => currentStage.assignedRole.includes(role));
      return hasAuthorizedRole;
    }

    return true; // Defer to condition registry during execution
  }
}

