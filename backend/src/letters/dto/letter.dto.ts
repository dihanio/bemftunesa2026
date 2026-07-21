import { IsString, IsOptional, IsEnum, IsMongoId, IsDateString } from 'class-validator';

export class CreateLetterDto {
  @IsEnum(['incoming', 'outgoing', 'proposal', 'lpj'])
  type: string;

  @IsString()
  subject: string;

  @IsString()
  sender: string;

  @IsString()
  recipient: string;

  @IsOptional()
  @IsMongoId()
  department?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;
  
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsDateString()
  deadlineDate?: string;

  @IsOptional()
  @IsEnum(['internal', 'fakultas', 'universitas', 'eksternal'])
  impactScale?: string;

  @IsOptional()
  @IsEnum(['normal', 'high', 'urgent'])
  urgencyLevel?: string;
}

export class UpdateLetterDto {
  @IsOptional()
  @IsEnum(['draft', 'review_kadep', 'review_ketua', 'approved', 'rejected', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  sender?: string;

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  approvalNotes?: string;

  @IsOptional()
  @IsDateString()
  deadlineDate?: string;

  @IsOptional()
  @IsEnum(['internal', 'fakultas', 'universitas', 'eksternal'])
  impactScale?: string;

  @IsOptional()
  @IsEnum(['normal', 'high', 'urgent'])
  urgencyLevel?: string;
}

export class QueryLetterDto {
  @IsOptional()
  @IsEnum(['incoming', 'outgoing', 'proposal', 'lpj'])
  type?: string;

  @IsOptional()
  @IsEnum(['draft', 'review_kadep', 'review_ketua', 'approved', 'rejected', 'archived'])
  status?: string;

  @IsOptional()
  @IsMongoId()
  department?: string;
}
