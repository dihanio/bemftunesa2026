import { IsString, IsEmail, IsOptional, IsEnum, IsMongoId, IsUrl, IsObject, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { APPLICANT_STATUSES } from '../../schemas/applicant.schema';
import type { ApplicantStatus } from '../../schemas/applicant.schema';

export class ApplicantCvDto {
  @IsString()
  url: string;

  @IsString()
  filename: string;
}

export class RegisterApplicantDto {
  @IsString()
  name: string;

  @IsString()
  nim: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  department: string;

  @IsString()
  batch: string;

  @IsString()
  positionChoice: string;

  @IsOptional()
  @IsString()
  motivation?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicantCvDto)
  cv?: ApplicantCvDto;

  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsObject()
  extraFields?: Record<string, unknown>;
}

export class UpdateApplicantStatusDto {
  @IsEnum(APPLICANT_STATUSES)
  status: ApplicantStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ScheduleInterviewDto {
  @IsString()
  scheduledAt: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsMongoId()
  interviewerId?: string;

  @IsOptional()
  @IsString()
  interviewerName?: string;
}

export class InterviewScoringDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  communication?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  motivation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  teamwork?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  leadership?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  technical?: number;
}

export class SubmitInterviewResultDto {
  @ValidateNested()
  @Type(() => InterviewScoringDto)
  scoring: InterviewScoringDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SetFinalResultDto {
  @IsEnum(['accepted', 'rejected'])
  status: 'accepted' | 'rejected';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApplicantQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(APPLICANT_STATUSES)
  status?: ApplicantStatus;

  @IsOptional()
  @IsString()
  positionChoice?: string;

  @IsOptional()
  @IsString()
  department?: string;
}
