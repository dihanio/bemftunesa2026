import {
  IsString,
  IsOptional,
  IsArray,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateFolderDto {
  @IsString()
  path: string;
}
