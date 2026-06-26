import { IsString, IsOptional, IsNotEmpty, IsObject, IsArray, IsEnum, IsNumber } from 'class-validator';
import type { SuratType, SuratCategory } from '../../../schemas/surat.schema';
import { ExportFormat } from '../../document-platform/export-engine/export-engine.service';

export class CreateSuratDraftDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(['incoming', 'outgoing'])
  @IsNotEmpty()
  type: SuratType;

  @IsEnum(['internal', 'external'])
  @IsNotEmpty()
  category: SuratCategory;

  @IsString()
  @IsNotEmpty()
  sender: string;

  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  cabinetPeriodId?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsString()
  @IsOptional()
  fileHash?: string;

  @IsOptional()
  @IsString()
  workflowDefinitionId?: string;
}

export class UploadDocumentVersionDto {
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsNumber()
  @IsNotEmpty()
  fileSize: number;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsString()
  @IsOptional()
  fileHash?: string;

  @IsString()
  @IsOptional()
  notes?: string;
  
  @IsString()
  @IsNotEmpty()
  versionType: string; // 'review', 'internal_signed', 'final_external'
}

export class AiGenerateDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsNumber()
  @IsOptional()
  expectedRevision?: number; // Used for Optimistic Locking check
}

export class AiReviseDto {
  @IsString()
  @IsNotEmpty()
  revisionNote: string;

  @IsNumber()
  @IsOptional()
  expectedRevision?: number; // Used for Optimistic Locking check
}

export class WorkflowActionDto {
  @IsString()
  @IsOptional()
  comment?: string;
}

export class SuratQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // Search by title, sender, recipient

  @IsOptional()
  @IsString()
  status?: string; // Filter by workflow state (DRAFT, SUBMITTED, dll)

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  cabinetPeriodId?: string;

  @IsOptional()
  @IsString()
  submittedBy?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string; // e.g. 'createdAt', '-createdAt'
}
