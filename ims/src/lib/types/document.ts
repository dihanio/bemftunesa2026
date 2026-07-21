export enum DocumentState {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  EDITED = 'EDITED',
  SUBMITTED = 'SUBMITTED',
  REVIEWED = 'REVIEWED',
  REVISION = 'REVISION',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
  NUMBERED = 'NUMBERED',
  SIGNED = 'SIGNED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED'
}

export enum WorkflowAction {
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_REVISION = 'REQUEST_REVISION',
  RETURN = 'RETURN',
  CANCEL = 'CANCEL',
  PUBLISH = 'PUBLISH',
  ARCHIVE = 'ARCHIVE'
}

export interface WorkflowHistoryEntry {
  actor: unknown; // User object or ID
  action: WorkflowAction;
  stepIndex: number;
  fromState: DocumentState;
  toState: DocumentState;
  comment?: string;
  timestamp: string;
}

export interface WorkflowInstance {
  _id: string;
  documentId: string;
  documentType: string;
  workflowDefinition: string;
  currentState: DocumentState;
  currentStepIndex: number;
  currentApprovers: string[];
  history: WorkflowHistoryEntry[];
}

export interface DocumentBase {
  _id: string;
  title: string;
  workflowInstance?: WorkflowInstance;
  createdAt: string;
  updatedAt: string;
}
