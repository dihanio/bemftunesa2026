export interface LetterDepartmentDTO {
  _id: string;
  name: string;
  code: string;
}

export interface LetterCreatorDTO {
  _id: string;
  name: string;
}

export interface LetterDTO {
  _id: string;
  referenceNumber?: string;
  type: string;
  subject: string;
  sender: string;
  recipient: string;
  status: string;
  department?: LetterDepartmentDTO;
  createdBy: LetterCreatorDTO;
  documentUrl?: string;
  approvalNotes?: string;
  dateApproved?: string;
  createdAt: string;
  deadlineDate?: string;
  impactScale?: string;
  urgencyLevel?: string;
  smartScore?: number;
}

export interface LettersResponseDTO {
  data: LetterDTO[];
}
