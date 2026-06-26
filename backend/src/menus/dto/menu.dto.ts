import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsNumber,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class MenuItemChildDto {
  @IsString()
  label: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsEnum(['_self', '_blank'])
  target?: string;
}

export class MenuItemDto {
  @IsString()
  label: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsEnum(['_self', '_blank'])
  target?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemChildDto)
  children?: MenuItemChildDto[];
}

export class CreateMenuDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemDto)
  items?: MenuItemDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMenuDto extends PartialType(CreateMenuDto) {}
