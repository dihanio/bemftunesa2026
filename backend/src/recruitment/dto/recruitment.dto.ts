import {
  IsString, IsOptional, IsArray, IsEnum, IsUrl,
  IsDateString, ValidateNested, IsNumber, MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class RecruitmentPositionDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() quota?: number;
  @IsOptional() @IsString() requirements?: string;
}

export class RecruitmentTimelineDto {
  @IsString() label: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsNumber() order?: number;
}

export class CreateRecruitmentDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(2) slug: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() poster?: string;

  @IsOptional()
  @IsEnum(['draft', 'open', 'closed', 'announced'])
  status?: string;

  @IsOptional() @IsDateString() openDate?: string;
  @IsOptional() @IsDateString() closeDate?: string;
  @IsOptional() @IsString() formUrl?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() contactWhatsapp?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecruitmentPositionDto)
  positions?: RecruitmentPositionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecruitmentTimelineDto)
  timeline?: RecruitmentTimelineDto[];

  @IsOptional() @IsString() period?: string;
}

export class UpdateRecruitmentStatusDto {
  @IsEnum(['draft', 'open', 'closed', 'announced'])
  status: string;
}

export class UpdateRecruitmentDto extends PartialType(CreateRecruitmentDto) {}

export class RecruitmentQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString()
  q?: string;

  @IsOptional() @IsEnum(['draft', 'open', 'closed', 'announced'])
  status?: string;

  @IsOptional() @IsString()
  period?: string;
}
