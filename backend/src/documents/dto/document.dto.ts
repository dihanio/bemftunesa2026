import { IsString, IsOptional, IsArray, IsMongoId, IsObject } from 'class-validator';

export class CreateDocumentDto {
  @IsMongoId()
  cabinetPeriod: string;

  @IsMongoId()
  department: string;

  @IsOptional()
  @IsMongoId()
  program?: string;

  @IsString()
  title: string;

  @IsString()
  type: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  accessLevel?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  accessLevel?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class QueryDocumentDto {
  @IsOptional()
  @IsMongoId()
  department?: string;

  @IsOptional()
  @IsMongoId()
  cabinetPeriod?: string;

  @IsOptional()
  @IsMongoId()
  program?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  accessLevel?: string;
}
