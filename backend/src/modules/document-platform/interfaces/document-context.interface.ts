import { Types } from 'mongoose';

export interface DocumentContext {
  templateId?: string | Types.ObjectId;
  templateVersion?: number;
  documentType: string; // e.g., 'surat', 'proposal', 'lpj'
  documentData: Record<string, any>; // The parsed JSON placeholders
  currentUser?: {
    id: string | Types.ObjectId;
    role: string;
    department?: string | Types.ObjectId;
  };
  organization?: string;
  cabinetPeriod?: string | Types.ObjectId;
  metadata?: Record<string, any>;
  simulatedDate?: string; // ISO date string for preview/simulation
}

export interface RenderOptions {
  strict?: boolean; // If true, throws error on missing required placeholders
  format?: 'html' | 'pdf' | 'docx'; // Defaults to html for the template engine layer
}

export interface RenderResult {
  content: string; // The rendered content (e.g., HTML string)
  metadata: {
    missingPlaceholders?: string[];
    renderTimeMs?: number;
  };
}
