import { api } from "@bemft/api-client";

export interface WorkflowStep {
  id: string;
  label: string;
  requiresMfa?: boolean;
  terminal?: boolean;
}

export interface WorkflowTransition {
  action: string;
  from: string;
  to: string;
}

export interface WorkflowDefinition {
  _id: string;
  key: string;
  version: number;
  label: string;
  entity: string;
  initialStep: string;
  steps: WorkflowStep[];
  transitions: WorkflowTransition[];
  isActive: boolean;
}

export const workflowsService = {
  list: async () => {
    return api.get<{ data: WorkflowDefinition[] }>("/ims/workflows");
  },

  upsert: async (data: any) => {
    return api.post<{ data: WorkflowDefinition }>("/ims/workflows", data);
  },
};
