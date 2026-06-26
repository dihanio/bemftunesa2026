import {
  IsString, IsOptional, IsBoolean, IsNumber,
  IsEnum, IsUrl, MaxLength, MinLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreatePartnerDto {
  @IsString() @MinLength(2) @MaxLength(100)
  name: string;

  @IsString() @MinLength(2)
  slug: string;

  @IsOptional() @IsString()
  logo?: string;

  @IsOptional() @IsString()
  website?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['partner', 'sponsor', 'media_partner', 'supporter'])
  type?: string;

  @IsOptional()
  @IsEnum(['platinum', 'gold', 'silver', 'bronze'])
  tier?: string;

  @IsOptional() @IsString()
  period?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsNumber()
  order?: number;
}

export class UpdatePartnerDto extends PartialType(CreatePartnerDto) {}

export class PartnerQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString()
  q?: string;

  @IsOptional() @IsEnum(['partner', 'sponsor', 'media_partner', 'supporter'])
  type?: string;

  @IsOptional() @IsString()
  period?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
