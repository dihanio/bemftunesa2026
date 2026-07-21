import { DocumentBase } from './document';

export interface Surat extends DocumentBase {
  type: 'incoming' | 'outgoing';
  category: 'internal' | 'external';
  sender: string;
  recipient: string;
  template: unknown; // Template object or ID
  templateVersion: number;
  templateData: Record<string, unknown>;
  department?: { _id: string; name: string } | string;
  cabinetPeriod: string;
  submittedBy: unknown; // User
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
  approvedBy?: unknown;
}
