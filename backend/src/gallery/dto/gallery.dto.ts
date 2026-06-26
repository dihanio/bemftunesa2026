import {
  IsString, IsOptional, IsArray, IsEnum,
  IsDateString, MinLength, IsNumber,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateGalleryDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(2) slug: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() cover?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @IsOptional() @IsDateString() eventDate?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsNumber() order?: number;
}

export class UpdateGalleryStatusDto {
  @IsEnum(['draft', 'published', 'archived'])
  status: string;
}

export class AddPhotosDto {
  @IsArray() @IsString({ each: true })
  photoIds: string[];
}

export class UpdateGalleryDto extends PartialType(CreateGalleryDto) {}

export class GalleryQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString()
  q?: string;

  @IsOptional() @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @IsOptional() @IsString()
  tag?: string;
}
