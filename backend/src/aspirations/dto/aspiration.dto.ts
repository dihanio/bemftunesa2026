import { IsString, IsOptional, IsBoolean, IsEnum, IsMongoId } from 'class-validator';

export class CreateAspirationDto {
  @IsOptional()
  @IsString()
  cabinetPeriod?: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  urgency?: string;
}

export class UpdateAspirationDto {
  @IsOptional()
  @IsEnum(['new', 'processing', 'pending', 'resolved', 'rejected'])
  status?: string;

  @IsOptional()
  @IsMongoId()
  assignedDepartment?: string;

  @IsOptional()
  @IsString()
  officialResponse?: string;
}

export class QueryAspirationDto {
  @IsOptional()
  @IsEnum(['new', 'processing', 'pending', 'resolved', 'rejected'])
  status?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  urgency?: string;

  @IsOptional()
  @IsString()
  cabinetPeriod?: string;
}
