import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WorkflowEventPayload } from './workflow-event.payload';
// Import other services here later (e.g. Numbering, Notification, etc.)

@Injectable()
export class WorkflowEventSubscriber {
  private readonly logger = new Logger(WorkflowEventSubscriber.name);

  constructor() {}

  @OnEvent('workflow.transitioned')
  async handleWorkflowTransition(payload: WorkflowEventPayload) {
    this.logger.log(`Workflow Transition Event: ${payload.documentType} [${payload.documentId}] moved to ${payload.toStage} via ${payload.action}`);
    
    // Here we can trigger numbering logic if the stage requires it
    // Example: if (payload.toStage === 'approved') this.numberingService.generateNumber(...)
  }

  // Example of specific action hook
  @OnEvent('workflow.action.publish')
  async handlePublishAction(payload: WorkflowEventPayload) {
    this.logger.log(`Document Published: ${payload.documentId}`);
    // Trigger notification, sync to drive, etc.
  }
}
