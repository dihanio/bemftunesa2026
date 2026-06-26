import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Generic Setting DTO
export class UpsertSettingDto {
  @IsString()
  key: string;

  value: unknown;

  @IsOptional()
  @IsString()
  group?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// Homepage Builder DTOs
export class HomepageSectionDto {
  @IsEnum(['hero', 'about', 'statistics', 'news', 'events', 'partners', 'cta'])
  sectionType: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpdateHomepageDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomepageSectionDto)
  sections: HomepageSectionDto[];
}
