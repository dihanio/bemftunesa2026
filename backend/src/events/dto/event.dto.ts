import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { SeoDto } from '../../content/dto/content.dto';

export class EventSpeakerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class EventSponsorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  url?: string;
}

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(3)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(['draft', 'review', 'published', 'archived'])
  status?: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  registrationLink?: string;

  @IsOptional()
  @IsNumber()
  quota?: number;

  @IsOptional()
  @IsString()
  poster?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventSpeakerDto)
  speakers?: EventSpeakerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventSponsorDto)
  sponsors?: EventSponsorDto[];

  @IsOptional()
  @IsBoolean()
  certificate?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoDto)
  seo?: SeoDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class UpdateEventStatusDto {
  @IsEnum(['draft', 'review', 'published', 'archived'])
  status: string;
}

export class EventQueryDto extends PaginationQueryDto {
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
