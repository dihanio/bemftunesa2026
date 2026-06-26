import {
  IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength,
} from 'class-validator';

export class CreateSuratDto {
  @IsNotEmpty() @IsString() @MaxLength(200)
  title: string;

  @IsEnum(['incoming', 'outgoing'])
  type: 'incoming' | 'outgoing';

  @IsEnum(['internal', 'external'])
  category: 'internal' | 'external';

  @IsNotEmpty() @IsString()
  sender: string;

  @IsNotEmpty() @IsString()
  recipient: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  bodyHtml?: string;

  @IsMongoId()
  cabinetPeriod: string;

  @IsOptional() @IsMongoId()
  department?: string;
}

export class UpdateSuratDto {
  @IsOptional() @IsString() @MaxLength(200)
  title?: string;

  @IsOptional() @IsString()
  sender?: string;

  @IsOptional() @IsString()
  recipient?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  bodyHtml?: string;
}

export class RejectSuratDto {
  @IsNotEmpty() @IsString()
  notes: string;
}

export class ApproveSuratDto {
  @IsOptional() @IsString()
  letterNumber?: string;
}
