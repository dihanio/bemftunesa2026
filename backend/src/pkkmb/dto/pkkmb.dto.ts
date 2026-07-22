import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsEnum,
  IsMongoId,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MabaCheckinDto {
  @ApiProperty({
    description: 'ID Sesi Presensi',
    example: '60d5ec49f1a2c8a1b4e12345',
  })
  @IsMongoId()
  @IsNotEmpty()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Token QR Code', example: 'abc123xyz' })
  @IsString()
  @IsOptional()
  qrToken?: string;

  @ApiPropertyOptional({ description: 'Garis Lintang GPS', example: -7.311 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Garis Bujur GPS', example: 112.729 })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class MabaSubmitTaskDto {
  @ApiProperty({
    description: 'URL Lampiran Tugas',
    example: 'https://storage.googleapis.com/bucket/tugas.pdf',
  })
  @IsUrl()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'Catatan tambahan pengumpulan',
    example: 'Berikut revisi tugas saya',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateAttendanceSessionDto {
  @ApiProperty({
    description: 'Judul Sesi Presensi',
    example: 'Presensi Materi 1',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Tanggal dan Waktu Presensi',
    example: '2026-08-15T08:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({
    description: 'Token QR (Jika presensi via QR)',
    example: 'xyz987',
  })
  @IsString()
  @IsOptional()
  qrCodeToken?: string;

  @ApiPropertyOptional({
    description: 'Waktu kedaluwarsa Token QR',
    example: '2026-08-15T09:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  qrExpiry?: string;

  @ApiPropertyOptional({
    description: 'Garis Lintang titik presensi',
    example: -7.311,
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Garis Bujur titik presensi',
    example: 112.729,
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Batas radius (meter) yang diizinkan',
    example: 50,
    default: 50,
  })
  @IsNumber()
  @Min(10)
  @IsOptional()
  radiusMeter?: number;
}

export class CreateTaskDto {
  @ApiProperty({ description: 'Judul Tugas', example: 'Tugas Essay' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Deskripsi Detail Tugas',
    example: 'Buat essay minimal 500 kata...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Batas Waktu Pengumpulan',
    example: '2026-08-17T23:59:59Z',
  })
  @IsDateString()
  @IsNotEmpty()
  deadline: string;

  @ApiProperty({ description: 'Tipe Tugas', enum: ['individu', 'kelompok'] })
  @IsEnum(['individu', 'kelompok'])
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({
    description: 'Format file yang diperbolehkan',
    example: ['.pdf', '.doc'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedFormats?: string[];
}

export class GradeSubmissionDto {
  @ApiProperty({ description: 'Nilai Tugas (0-100)', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional({
    description: 'Feedback/Komentar Penilaian',
    example: 'Tugas cukup baik, tingkatkan lagi',
  })
  @IsString()
  @IsOptional()
  feedback?: string;
}

export class AdminManualCheckinDto {
  @ApiProperty({
    description: 'ID User Mahasiswa Baru',
    example: '60d5ec49f1a2c8a1b4e12345',
  })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Status Presensi',
    enum: ['Hadir', 'Telat', 'Tidak Hadir'],
  })
  @IsEnum(['Hadir', 'Telat', 'Tidak Hadir'])
  @IsNotEmpty()
  status: string;
}

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Nomor halaman', example: 1, default: 1 })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({
    description: 'Jumlah data per halaman',
    example: 10,
    default: 10,
  })
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({ description: 'Kata kunci pencarian' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Kolom untuk sorting' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Arah sorting',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
