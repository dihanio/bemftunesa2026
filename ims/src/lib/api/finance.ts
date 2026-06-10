import { api } from "@bemft/api-client";

export interface Proposal {
  _id: string;
  prokerId: string;
  title: string;
  description?: string;
  version: number;
  status: "Draft" | "Submitted" | "Revision" | "Approved";
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RABItem {
  _id: string;
  prokerId: string;
  proposalId: string;
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  status: "Planned" | "Approved" | "Rejected";
}

export interface LPJ {
  _id: string;
  prokerId: string;
  content?: string;
  status: "Pending" | "Validated" | "Revision";
  fileUrl?: string;
  createdAt: string;
}

export const financeService = {
  // Proposals
  listProposals: async (query?: any) => {
    return api.get<{ data: Proposal[]; meta: any }>("/ims/proposals", query);
  },

  createProposal: async (data: any) => {
    return api.post<{ data: Proposal }>("/ims/proposals", data);
  },

  approveProposal: async (id: string) => {
    return api.patch<{ data: Proposal }>(`/ims/proposals/${id}/approve`, {});
  },

  // LPJ
  listLPJ: async (query?: any) => {
    return api.get<{ data: LPJ[]; meta: any }>("/ims/lpj", query);
  },

  createLPJ: async (data: any) => {
    return api.post<{ data: LPJ }>("/ims/lpj", data);
  },

  listSPJ: async (query?: any) => {
    return api.get<{ data: any[]; meta?: any }>("/ims/spj", query);
  },

  listRABItems: async (proposalId: string) => {
    return api.get<{ data: RABItem[] }>(`/ims/proposals/${proposalId}/rab`);
  },

  updateRABItemStatus: async (
    itemId: string,
    status: "Approved" | "Rejected",
  ) => {
    return api.patch<{ data: RABItem }>(`/ims/proposals/rab/${itemId}`, {
      status,
    });
  },
};
