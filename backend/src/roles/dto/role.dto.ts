import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsMongoId } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Nama Role', example: 'Panitia Khusus' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Deskripsi Role' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Daftar ID Permission', example: ['60d5ec49f1a2c8a1b4e12345'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  permissions?: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Nama Role' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Deskripsi Role' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Daftar ID Permission' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  permissions?: string[];
}
