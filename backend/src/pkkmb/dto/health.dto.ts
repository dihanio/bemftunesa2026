import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CONDITION_STATUSES } from '../../schemas/health-record.schema';
import { EMERGENCY_RELATIONS } from '../../schemas/health-profile.schema';

export class HealthRecordDto {
  @ApiPropertyOptional({ description: 'ID riwayat (untuk update/delete)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Nama penyakit (bebas atau dari master)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Kategori penyakit',
    enum: [
      'Pernapasan',
      'Jantung',
      'Pencernaan',
      'Saraf',
      'Alergi',
      'Kronis',
      'Lainnya',
    ],
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'Tahun mulai mengalami' })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  yearStart?: number;

  @ApiPropertyOptional({
    description: 'Status kondisi',
    enum: CONDITION_STATUSES,
  })
  @IsOptional()
  @IsString()
  conditionStatus?: string;

  @ApiPropertyOptional({ description: 'Membutuhkan obat rutin?' })
  @IsOptional()
  @IsBoolean()
  needsMedication?: boolean;

  @ApiPropertyOptional({ description: 'Keterangan tambahan' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpsertHealthProfileDto {
  @ApiProperty({ description: 'Memiliki riwayat penyakit?' })
  @IsBoolean()
  hasMedicalHistory: boolean;

  @ApiPropertyOptional({ description: 'Nomor BPJS (11-13 digit)' })
  @IsOptional()
  @IsString()
  @MaxLength(13)
  bpjsNumber?: string;

  @ApiPropertyOptional({ description: 'Status kepesertaan BPJS' })
  @IsOptional()
  @IsString()
  bpjsStatus?: string;

  @ApiPropertyOptional({ description: 'Nama kontak darurat' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactName?: string;

  @ApiPropertyOptional({
    description: 'Hubungan kontak darurat',
    enum: EMERGENCY_RELATIONS,
  })
  @IsOptional()
  @IsString()
  emergencyContactRelation?: string;

  @ApiPropertyOptional({ description: 'No WhatsApp kontak darurat' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({
    description: 'Daftar riwayat penyakit',
    type: [HealthRecordDto],
  })
  @IsOptional()
  @IsArray()
  records?: HealthRecordDto[];
}

export class CreateHealthConditionDto {
  @ApiProperty({ description: 'Nama penyakit' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Kategori',
    enum: [
      'Pernapasan',
      'Jantung',
      'Pencernaan',
      'Saraf',
      'Alergi',
      'Kronis',
      'Lainnya',
    ],
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Tingkat risiko',
    enum: ['RENDAH', 'SEDANG', 'TINGGI'],
    default: 'RENDAH',
  })
  @IsEnum(['RENDAH', 'SEDANG', 'TINGGI'])
  riskLevel: 'RENDAH' | 'SEDANG' | 'TINGGI';
}

export class OnboardingConsentDto {
  @ApiProperty({ description: 'Versi pernyataan', example: '1.0' })
  @IsString()
  @IsNotEmpty()
  statementVersion: string;

  @ApiProperty({ description: 'Teks pernyataan yang disetujui' })
  @IsString()
  @IsNotEmpty()
  statementText: string;

  @ApiProperty({
    description: 'Tanda tangan digital (data URL PNG)',
    example: 'data:image/png;base64,...',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
