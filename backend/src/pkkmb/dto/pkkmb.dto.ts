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
    example: 'Hari 1 - Opening Ceremony & Registrasi Pagi',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Tanggal Sesi', example: '2026-08-15' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Jam Mulai Sesi',
    example: '2026-08-15T07:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'Jam Selesai Sesi',
    example: '2026-08-15T09:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    description: 'Lokasi Sesi Presensi',
    example: 'Gedung Dekanat FT UNESA',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({
    description: 'Target Jenis Peserta',
    enum: ['ALL', 'MABA', 'PANITIA'],
    default: 'ALL',
  })
  @IsEnum(['ALL', 'MABA', 'PANITIA'])
  @IsOptional()
  targetParticipantType?: 'ALL' | 'MABA' | 'PANITIA';

  @ApiPropertyOptional({
    description: 'Target Divisi Panitia (Opsional)',
    example: 'Sie Acara',
  })
  @IsString()
  @IsOptional()
  targetDivision?: string;

  @ApiPropertyOptional({
    description: 'Status Sesi',
    enum: ['DRAFT', 'PUBLISHED', 'CLOSED'],
  })
  @IsEnum(['DRAFT', 'PUBLISHED', 'CLOSED'])
  @IsOptional()
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

export class CheckInDto {
  @ApiProperty({ description: 'ID Sesi Presensi' })
  @IsMongoId()
  @IsNotEmpty()
  sessionId: string;

  @ApiPropertyOptional({ description: 'ID User Peserta (Jika via Operator)' })
  @IsMongoId()
  @IsOptional()
  participantId?: string;

  @ApiPropertyOptional({ description: 'NIM / NIP / Email Peserta (Pencarian)' })
  @IsString()
  @IsOptional()
  nim?: string;

  @ApiPropertyOptional({ description: 'Token QR Code dari scan' })
  @IsString()
  @IsOptional()
  qrToken?: string;

  @ApiPropertyOptional({
    description: 'Metode Check-in',
    enum: ['QR_CODE', 'MANUAL_OPERATOR', 'SEARCH_NIM', 'SELF_CHECKIN'],
    default: 'QR_CODE',
  })
  @IsEnum(['QR_CODE', 'MANUAL_OPERATOR', 'SEARCH_NIM', 'SELF_CHECKIN'])
  @IsOptional()
  method?: 'QR_CODE' | 'MANUAL_OPERATOR' | 'SEARCH_NIM' | 'SELF_CHECKIN';

  @ApiPropertyOptional({
    description: 'Status Kehadiran',
    enum: ['Hadir', 'Telat', 'Izin', 'Sakit', 'Tidak Hadir'],
    default: 'Hadir',
  })
  @IsEnum(['Hadir', 'Telat', 'Izin', 'Sakit', 'Tidak Hadir'])
  @IsOptional()
  status?: 'Hadir' | 'Telat' | 'Izin' | 'Sakit' | 'Tidak Hadir';

  @ApiPropertyOptional({ description: 'Catatan tambahan presensi' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsNumber()
  @IsOptional()
  lng?: number;
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

  @ApiPropertyOptional({ description: 'Urutan sorting (asc / desc)' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class AttendanceFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'ID Sesi Presensi' })
  @IsMongoId()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Filter Jenis Peserta',
    enum: ['MABA', 'PANITIA'],
  })
  @IsEnum(['MABA', 'PANITIA'])
  @IsOptional()
  participantType?: 'MABA' | 'PANITIA';

  @ApiPropertyOptional({ description: 'Filter Divisi Panitia (Sie)' })
  @IsString()
  @IsOptional()
  division?: string;

  @ApiPropertyOptional({ description: 'Filter Status Kehadiran' })
  @IsString()
  @IsOptional()
  status?: string;
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
    description: 'Status Tugas',
    enum: ['PUBLISHED', 'DRAFT'],
  })
  @IsEnum(['PUBLISHED', 'DRAFT'])
  @IsOptional()
  status?: 'PUBLISHED' | 'DRAFT';

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

export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'Judul Pengumuman',
    example: 'Pengumuman Pra-PKKMB',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Isi Pengumuman',
    example: 'Maba wajib membawa buku...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Target audiens',
    enum: ['all', 'specific_groups'],
  })
  @IsEnum(['all', 'specific_groups'])
  @IsOptional()
  targetAudience?: 'all' | 'specific_groups';

  @ApiPropertyOptional({ description: 'ID Grup target (jika specific_groups)' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  targetGroups?: string[];

  @ApiPropertyOptional({
    description: 'Apakah pengumuman ini prioritas (di-pin)?',
  })
  @IsOptional()
  isPriority?: boolean;

  @ApiPropertyOptional({
    description: 'Status pengumuman',
    enum: ['PUBLISHED', 'DRAFT', 'SCHEDULED'],
  })
  @IsEnum(['PUBLISHED', 'DRAFT', 'SCHEDULED'])
  @IsOptional()
  status?: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED';

  @ApiPropertyOptional({ description: 'Waktu rilis otomatis jika dijadwalkan' })
  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Lampiran file URL' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

export class UpdateAnnouncementDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(['all', 'specific_groups'])
  @IsOptional()
  targetAudience?: 'all' | 'specific_groups';

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  targetGroups?: string[];

  @IsEnum(['PUBLISHED', 'DRAFT', 'SCHEDULED'])
  @IsOptional()
  status?: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED';

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsOptional()
  isPriority?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

export class CreateScheduleDto {
  @ApiProperty({
    description: 'Nama Kegiatan',
    example: 'Materi 1: Kepemimpinan',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Waktu Mulai', example: '2026-08-18T08:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'Waktu Selesai',
    example: '2026-08-18T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ description: 'Lokasi' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Penanggung Jawab (PIC)' })
  @IsString()
  @IsOptional()
  pic?: string;
}

export class UpdateScheduleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  pic?: string;
}

export class OnboardDto {
  @ApiProperty({ description: 'NIM Mahasiswa', example: '26051204001' })
  @IsString()
  @IsNotEmpty()
  nim: string;

  @ApiProperty({ description: 'Nama Lengkap', example: 'Andi Saputra' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Program Studi',
    example: 'S1 Teknik Informatika',
  })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ description: 'Jenis Kelamin', enum: ['L', 'P'] })
  @IsEnum(['L', 'P'])
  @IsNotEmpty()
  gender: 'L' | 'P';

  @ApiProperty({ description: 'Nomor WhatsApp', example: '081234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Nomor Darurat', example: '081234567890' })
  @IsString()
  @IsNotEmpty()
  emergencyContact: string;

  @ApiPropertyOptional({ description: 'Object Key Avatar / URL' })
  @IsString()
  @IsOptional()
  avatarObjectKey?: string;

  @ApiPropertyOptional({ description: 'Object Key KTM / URL' })
  @IsString()
  @IsOptional()
  ktmObjectKey?: string;
}

export class AdminCreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  nim?: string;

  @IsString()
  @IsNotEmpty()
  role: string; // role ID

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  division?: string; // Sie

  @IsString()
  @IsOptional()
  pkkmbGroup?: string; // Group ID
}

export class AdminUpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  nim?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  division?: string;

  @IsString()
  @IsOptional()
  pkkmbGroup?: string;
}
