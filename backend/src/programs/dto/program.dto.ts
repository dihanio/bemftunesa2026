import { IsString, IsOptional, IsNumber, IsMongoId } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  cabinetPeriod: string;

  @IsMongoId()
  department: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  pic?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  targetOutput?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  estimatedBudget?: number;

  @IsOptional()
  @IsString()
  fundingStatus?: string;
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  pic?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsString()
  targetOutput?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  estimatedBudget?: number;

  @IsOptional()
  @IsString()
  fundingStatus?: string;

  @IsOptional()
  @IsString()
  tor?: string;

  @IsOptional()
  @IsString()
  proposal?: string;

  @IsOptional()
  @IsString()
  lpj?: string;

  @IsOptional()
  @IsString()
  evaluationNotes?: string;
}

export class QueryProgramDto {
  @IsOptional()
  @IsMongoId()
  department?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  cabinetPeriod?: string;
}
