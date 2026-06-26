import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WorkflowEventPayload } from '../workflow-engine/events/workflow-event.payload';

@Injectable()
export class NotificationEngineService {
  private readonly logger = new Logger(NotificationEngineService.name);

  /**
   * Listen to generic document events from the Workflow Engine (legacy)
   */
  @OnEvent('document.*')
  handleDocumentEvent(payload: any) {
    this.logger.log(`Received document event for documentId: ${payload.documentId}`);
    this.sendInAppNotification(payload);
    
    if (this.shouldSendEmail(payload)) {
      this.sendEmailNotification(payload);
    }
  }

  /**
   * Listen to all workflow transitions from the new Workflow Platform
   */
  @OnEvent('workflow.transitioned')
  handleWorkflowTransition(payload: WorkflowEventPayload) {
    this.logger.log(`Workflow transition: ${payload.fromStage} → ${payload.toStage} (action: ${payload.action}) for ${payload.documentType}:${payload.documentId}`);
    
    this.sendInAppNotification({
      action: payload.action,
      documentId: payload.documentId,
      documentType: payload.documentType,
      fromStage: payload.fromStage,
      toStage: payload.toStage,
      actor: payload.actor,
    });

    const emailActions = ['APPROVE', 'REJECT', 'REQUEST_REVISION', 'PUBLISH'];
    if (emailActions.includes(payload.action.toUpperCase())) {
      this.sendEmailNotification({
        action: payload.action,
        documentId: payload.documentId,
        documentType: payload.documentType,
        actor: payload.actor,
      });
    }
  }

  private sendInAppNotification(payload: any) {
    // Stub: Save notification to the database for the user(s)
    this.logger.debug(`[In-App Notification Stub] -> Action: ${payload.action}, Doc: ${payload.documentId}`);
  }

  private sendEmailNotification(payload: any) {
    // Stub: Send an email using an EmailService or external provider
    this.logger.debug(`[Email Notification Stub] -> Action: ${payload.action}, Doc: ${payload.documentId}`);
  }

  private shouldSendEmail(payload: any): boolean {
    const emailActions = ['APPROVE', 'REJECT', 'REQUEST_REVISION'];
    return emailActions.includes(payload.action);
  }
}
