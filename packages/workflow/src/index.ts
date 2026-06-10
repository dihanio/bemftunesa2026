import { PERMISSIONS } from "@bemft/permissions";
import type {
  WorkflowDefinition,
  WorkflowTransitionDefinition,
} from "@bemft/types";

export const DEFAULT_WORKFLOW_DEFINITIONS: readonly WorkflowDefinition[] = [
  {
    key: "proposal_approval",
    version: 1,
    label: "Proposal Approval",
    entity: "proposal",
    initialStep: "secretary_review",
    steps: [
      {
        id: "secretary_review",
        label: "Secretary Review",
        requiredPermissions: [PERMISSIONS.documentsManage],
      },
      {
        id: "treasurer_review",
        label: "Treasurer Review",
        requiredPermissions: [PERMISSIONS.financeRead],
      },
      {
        id: "sc_review",
        label: "Steering Committee Review",
        requiredPermissions: [PERMISSIONS.prokerRead],
      },
      {
        id: "wabem_approval",
        label: "WaKaBEM Approval",
        requiredPermissions: [PERMISSIONS.workflowRead],
      },
      {
        id: "kabem_approval",
        label: "KaBEM Approval",
        requiredPermissions: [PERMISSIONS.documentsApprove],
        requiresMfa: true,
        terminal: true,
      },
    ],
    transitions: [
      {
        from: "secretary_review",
        to: "treasurer_review",
        action: "validate_admin",
        label: "Validate Administration",
        requiredPermissions: [PERMISSIONS.documentsManage],
      },
      {
        from: "treasurer_review",
        to: "sc_review",
        action: "validate_finance",
        label: "Validate Finance",
        requiredPermissions: [PERMISSIONS.financeApprove],
        requiresMfa: true,
      },
      {
        from: "sc_review",
        to: "wabem_approval",
        action: "sc_approve",
        label: "SC Approve",
        requiredPermissions: [PERMISSIONS.prokerRead],
      },
      {
        from: "wabem_approval",
        to: "kabem_approval",
        action: "wabem_approve",
        label: "WaKaBEM Approve",
        requiredPermissions: [PERMISSIONS.workflowRead],
      },
    ],
  },
  {
    key: "committee_lifecycle",
    version: 1,
    label: "Committee Lifecycle",
    entity: "committee",
    initialStep: "Planning",
    steps: [
      { id: "Planning", label: "Planning" },
      { id: "Active", label: "Active" },
      { id: "Event Finished", label: "Event Finished" },
      { id: "LPJ Revision", label: "LPJ Revision" },
      { id: "LPJ Approved", label: "LPJ Approved" },
      { id: "Archived", label: "Archived", terminal: true },
    ],
    transitions: [
      {
        from: "Planning",
        to: "Active",
        action: "activate",
        label: "Activate",
        requiredPermissions: [PERMISSIONS.committeeManage],
      },
      {
        from: "Active",
        to: "Event Finished",
        action: "finish_event",
        label: "Finish Event",
        requiredPermissions: [PERMISSIONS.committeeManage],
      },
      {
        from: "Event Finished",
        to: "LPJ Revision",
        action: "request_lpj_revision",
        label: "Request LPJ Revision",
        requiredPermissions: [PERMISSIONS.documentsManage],
      },
      {
        from: "LPJ Revision",
        to: "LPJ Approved",
        action: "approve_lpj",
        label: "Approve LPJ",
        requiredPermissions: [PERMISSIONS.documentsApprove],
        requiresMfa: true,
      },
      {
        from: "LPJ Approved",
        to: "Archived",
        action: "archive",
        label: "Archive",
        requiredPermissions: [PERMISSIONS.committeeManage],
      },
    ],
  },
];

export function findWorkflowTransition(
  definition: WorkflowDefinition,
  currentStep: string,
  action: string,
): WorkflowTransitionDefinition | undefined {
  return definition.transitions.find(
    (transition) =>
      transition.from === currentStep && transition.action === action,
  );
}
