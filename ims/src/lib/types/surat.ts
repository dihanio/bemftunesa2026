import { DocumentBase } from './document';

export interface Surat extends DocumentBase {
  type: 'incoming' | 'outgoing';
  category: 'internal' | 'external';
  sender: string;
  recipient: string;
  template: any; // Template object or ID
  templateVersion: number;
  templateData: Record<string, any>;
  department?: { _id: string; name: string } | string;
  cabinetPeriod: string;
  submittedBy: any; // User
  letterNumber?: string;
  fileUrl?: string;
  aiMetadata?: {
    provider: string;
    model: string;
    prompt: string;
    generatedAt: string;
  };
  revision: number;

  // Legacy fields — still returned by backend during migration period
  status?: string;
  notes?: string;
  bodyHtml?: string;
  approvedBy?: any;
}
