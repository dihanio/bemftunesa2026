import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsObject,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class SeoDto {
  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string;
}

export class CreateContentDto {
  @IsEnum(['news', 'announcement', 'page', 'service'])
  type: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(3)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(['draft', 'review', 'published', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoDto)
  seo?: SeoDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateContentDto extends PartialType(CreateContentDto) {}

export class UpdateContentStatusDto {
  @IsEnum(['draft', 'review', 'published', 'archived'])
  status: string;
}

export class ContentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['news', 'announcement', 'page', 'service'])
  type?: string;

  @IsOptional()
  @IsEnum(['draft', 'review', 'published', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
