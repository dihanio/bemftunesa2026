export type LetterType = 'incoming' | 'outgoing' | 'proposal' | 'lpj';
export type LetterStatus = 'draft' | 'review_kadep' | 'review_ketua' | 'approved' | 'rejected' | 'archived';

export interface LetterDepartment {
  id: string;
  name: string;
  code: string;
}

export interface LetterCreator {
  id: string;
  name: string;
}

export interface LetterData {
  id: string;
  referenceNumber?: string;
  type: LetterType;
  subject: string;
  sender: string;
  recipient: string;
  status: LetterStatus;
  department?: LetterDepartment;
  createdBy: LetterCreator;
  documentUrl?: string;
  approvalNotes?: string;
  dateApproved?: string; // ISO 8601 Date String
  createdAt: string; // ISO 8601 Date String
  deadlineDate?: string;
  impactScale?: string;
  urgencyLevel?: string;
  smartScore?: number;
}

export interface LettersResponse {
  data: LetterData[];
  total: number;
}

