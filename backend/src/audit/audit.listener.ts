import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from './audit.service';
import { WorkflowEventPayload } from '../modules/document-platform/workflow-engine/events/workflow-event.payload';

interface AuditEventPayload {
  user: string;
  userName: string;
  action?: string;
  entity: string;
  entityId: string;
  summary?: string;
  changes?: { before?: unknown; after?: unknown };
}

const EVENT_ACTION_MAP: Record<string, string> = {
  'content.created': 'create',
  'content.updated': 'update',
  'content.publish': 'publish',
  'content.archive': 'archive',
  'content.deleted': 'delete',
};

@Injectable()
export class AuditListener {
  constructor(private auditService: AuditService) {}

  @OnEvent('content.created')
  handleCreated(payload: AuditEventPayload) {
    return this.auditService.log({
      ...payload,
      action: payload.action ?? 'create',
    });
  }

  @OnEvent('content.updated')
  handleUpdated(payload: AuditEventPayload) {
    return this.auditService.log({
      ...payload,
      action: payload.action ?? 'update',
    });
  }

  @OnEvent('content.publish')
  handlePublished(payload: AuditEventPayload) {
    return this.auditService.log({ ...payload, action: 'publish' });
  }

  @OnEvent('content.archive')
  handleArchived(payload: AuditEventPayload) {
    return this.auditService.log({ ...payload, action: 'archive' });
  }

  @OnEvent('content.deleted')
  handleDeleted(payload: AuditEventPayload) {
    return this.auditService.log({ ...payload, action: 'delete' });
  }

  // ==========================================
  // Workflow Platform Events
  // ==========================================

  @OnEvent('workflow.transitioned')
  handleWorkflowTransition(payload: WorkflowEventPayload) {
    return this.auditService.log({
      user: payload.actor,
      userName: '',
      action: `workflow.${payload.action.toLowerCase()}`,
      entity: payload.documentType,
      entityId: payload.documentId,
      summary: `Workflow transition: ${payload.fromStage} → ${payload.toStage} (action: ${payload.action})`,
      changes: {
        before: { stage: payload.fromStage },
        after: { stage: payload.toStage },
      },
    });
  }

  @OnEvent('workflow.action.publish')
  handleWorkflowPublish(payload: WorkflowEventPayload) {
    return this.auditService.log({
      user: payload.actor,
      userName: '',
      action: 'workflow.publish',
      entity: payload.documentType,
      entityId: payload.documentId,
      summary: `Document published via workflow`,
    });
  }
}
