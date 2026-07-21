import { IsString, IsOptional, IsMongoId, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CommitteeMemberDto {
  @IsMongoId()
  userId: string;

  @IsString()
  role: string; // Jabatan kepanitiaan (free-text)
}

export class CreateCommitteeDto {
  @IsMongoId()
  programId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitteeMemberDto)
  members?: CommitteeMemberDto[];
}

export class UpdateCommitteeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddMemberDto {
  @IsMongoId()
  userId: string;

  @IsString()
  role: string;
}
