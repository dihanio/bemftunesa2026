import { IsString, IsOptional, IsEnum, IsArray, IsDateString, IsNumber, IsUrl, ValidateNested } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

class PositionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  quota?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateRecruitmentDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  poster?: string;

  @IsOptional()
  @IsEnum(['open', 'closed', 'announced'])
  status?: string;

  @IsOptional()
  @IsDateString()
  openDate?: string;

  @IsOptional()
  @IsDateString()
  closeDate?: string;

  @IsOptional()
  @IsString()
  formUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PositionDto)
  positions?: PositionDto[];

  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsArray()
  requirements?: string[];

  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateRecruitmentDto extends PartialType(CreateRecruitmentDto) {}

export class RecruitmentQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(['open', 'closed', 'announced'])
  status?: string;
}
