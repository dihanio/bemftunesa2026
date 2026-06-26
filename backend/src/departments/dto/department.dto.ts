import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsEmail,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { SeoDto } from '../../content/dto/content.dto';

export class WorkProgramDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['planned', 'ongoing', 'completed'])
  status?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class DepartmentMemberDto {
  @IsString()
  user: string; // User ObjectId

  @IsString()
  position: string;
}

export class SocialMediaDto {
  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  twitter?: string;

  @IsOptional()
  @IsString()
  youtube?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;
}

export class DepartmentContactsDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;
}

export class CreateDepartmentDto {
  @IsString()
  cabinetPeriod: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(2)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  vision?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mission?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DepartmentContactsDto)
  contacts?: DepartmentContactsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoDto)
  seo?: SeoDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

export class DepartmentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
