export class WorkflowEventPayload {
  workflowId: string;
  workflowVersion: number;
  instanceId: string;
  documentId: string;
  documentType: string;
  action: string;
  fromStage: string;
  toStage: string;
  actor: string;
  timestamp: Date;
  metadata?: any;
}
