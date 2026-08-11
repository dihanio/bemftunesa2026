import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsMongoId,
  IsDateString,
  IsUrl,
  IsBoolean,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  QUIZ_VIOLATION_TYPES,
  QUIZ_EVENTS_MAX_PER_REQUEST,
} from '../quiz-anticheat';
import type { QuizViolationType } from '../quiz-anticheat';

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
    description: 'Sesi online/remote (skipp geofence saat self check-in)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

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

  @ApiPropertyOptional({ description: 'URL selfie hasil kamera saat check-in' })
  @IsString()
  @IsOptional()
  photoUrl?: string;
}

export class SubmitIzinDto {
  @ApiProperty({ description: 'ID Sesi Presensi' })
  @IsMongoId()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ enum: ['Izin', 'Sakit'] })
  @IsEnum(['Izin', 'Sakit'])
  @IsNotEmpty()
  izinType: 'Izin' | 'Sakit';

  @ApiProperty({ description: 'Alasan izin/sakit' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'URL bukti (surat izin/surat sakit)' })
  @IsString()
  @IsOptional()
  proofUrl?: string;
}

export class VerifyIzinDto {
  @ApiProperty({ description: 'ID Record Presensi' })
  @IsMongoId()
  @IsNotEmpty()
  recordId: string;

  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  @IsNotEmpty()
  decision: 'APPROVED' | 'REJECTED';
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

  @ApiPropertyOptional({
    description: 'Tipe Assignment (Google Classroom-like)',
    enum: ['TASK', 'QUIZ'],
    default: 'TASK',
  })
  @IsEnum(['TASK', 'QUIZ'])
  @IsOptional()
  assignmentType?: 'TASK' | 'QUIZ';

  @ApiPropertyOptional({
    description:
      'ID Quiz existing (wajib jika assignmentType=QUIZ). Quiz menjadi engine soal/attempt/timer/scoring; assignment hanya container.',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsOptional()
  quizId?: string;

  @ApiPropertyOptional({
    description: 'URL lampiran (opsional, utk TASK/MATERIAL)',
  })
  @IsUrl()
  @IsOptional()
  attachment?: string;

  @ApiPropertyOptional({ description: 'URL link (opsional)' })
  @IsUrl()
  @IsOptional()
  link?: string;

  @ApiPropertyOptional({
    description: 'Waktu mulai tugas tersedia (opsional)',
    example: '2026-08-11T01:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({
    description: 'Batas Waktu Pengumpulan',
    example: '2026-08-17T23:59:59Z',
  })
  @IsDateString()
  @IsNotEmpty()
  deadline: string;

  @ApiPropertyOptional({
    description:
      'Tipe Submisi utk TASK (individu/kelompok) — wajib jika assignmentType=TASK',
    enum: ['individu', 'kelompok'],
  })
  @IsEnum(['individu', 'kelompok'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    description: 'Status Tugas',
    enum: ['PUBLISHED', 'DRAFT', 'CLOSED'],
  })
  @IsEnum(['PUBLISHED', 'DRAFT', 'CLOSED'])
  @IsOptional()
  status?: 'PUBLISHED' | 'DRAFT' | 'CLOSED';

  @ApiPropertyOptional({
    description:
      'Target penugasan: ALL / FACULTY / STUDY_PROGRAM / GROUP / INDIVIDUAL',
    enum: ['ALL', 'FACULTY', 'STUDY_PROGRAM', 'GROUP', 'INDIVIDUAL'],
    default: 'ALL',
  })
  @IsEnum(['ALL', 'FACULTY', 'STUDY_PROGRAM', 'GROUP', 'INDIVIDUAL'])
  @IsOptional()
  targetType?: 'ALL' | 'FACULTY' | 'STUDY_PROGRAM' | 'GROUP' | 'INDIVIDUAL';

  @ApiPropertyOptional({
    description:
      'ID target sesuai targetType (StudyProgram / Group / User id, atau nama Fakultas untuk FACULTY)',
    example: [],
  })
  @IsArray()
  @IsOptional()
  targetIds?: string[];

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

  @ApiPropertyOptional({
    description:
      'Jenis aksi deep-link (quiz / task / attendance / schedule / general)',
    enum: ['quiz', 'task', 'attendance', 'schedule', 'general'],
    default: 'general',
  })
  @IsEnum(['quiz', 'task', 'attendance', 'schedule', 'general'])
  @IsOptional()
  actionType?: string;

  @ApiPropertyOptional({
    description: 'ID target aksi (quizId / taskId / sessionId)',
  })
  @IsString()
  @IsOptional()
  actionId?: string;
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

  @IsEnum(['quiz', 'task', 'attendance', 'schedule', 'general'])
  @IsOptional()
  actionType?: string;

  @IsString()
  @IsOptional()
  actionId?: string;
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

  @ApiPropertyOptional({
    description: 'Online (daring) atau Offline (tatap muka)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;
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

  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;
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

  @ApiPropertyOptional({
    description: 'Nomor Darurat (ditangani via health/me)',
    example: '081234567890',
  })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

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

// ─── QUIZ DTO ────────────────────────────────────────────────────────────

export class QuizQuestionDto {
  @ApiProperty({ description: 'Pertanyaan', example: 'Manakah tujuan PKKMB?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'Opsi jawaban',
    example: [
      { id: 'A', text: 'Ops A' },
      { id: 'B', text: 'Ops B' },
      { id: 'C', text: 'Ops C' },
      { id: 'D', text: 'Ops D' },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  options: { id: string; text: string }[];

  @ApiProperty({ description: 'Jawaban benar (id opsi)', example: 'B' })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiPropertyOptional({ description: 'Poin', default: 1 })
  @IsNumber()
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ description: 'Urutan', default: 0 })
  @IsNumber()
  @IsOptional()
  order?: number;
}

export class CreateQuizDto {
  @ApiProperty({ description: 'Judul Quiz', example: 'Pretest Pra-PKKMB' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Deskripsi' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Tipe Quiz',
    enum: ['PRETEST', 'POSTTEST', 'MATERIAL'],
  })
  @IsEnum(['PRETEST', 'POSTTEST', 'MATERIAL'])
  @IsNotEmpty()
  type: 'PRETEST' | 'POSTTEST' | 'MATERIAL';

  @ApiPropertyOptional({
    description: 'Status',
    enum: ['DRAFT', 'PUBLISHED', 'CLOSED'],
    default: 'DRAFT',
  })
  @IsEnum(['DRAFT', 'PUBLISHED', 'CLOSED'])
  @IsOptional()
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';

  @ApiPropertyOptional({
    description: 'Target',
    enum: ['ALL', 'FACULTY', 'STUDY_PROGRAM', 'GROUP', 'INDIVIDUAL'],
    default: 'ALL',
  })
  @IsEnum(['ALL', 'FACULTY', 'STUDY_PROGRAM', 'GROUP', 'INDIVIDUAL'])
  @IsOptional()
  targetType?: 'ALL' | 'FACULTY' | 'STUDY_PROGRAM' | 'GROUP' | 'INDIVIDUAL';

  @ApiPropertyOptional({ description: 'ID target sesuai targetType' })
  @IsArray()
  @IsOptional()
  targetIds?: string[];

  @ApiPropertyOptional({
    description: 'Mulai (WIB)',
    example: '2026-08-11T01:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Selesai (WIB)',
    example: '2026-08-11T16:59:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Durasi (menit)', default: 30 })
  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Max attempts', default: 1 })
  @IsNumber()
  @IsOptional()
  maxAttempts?: number;

  // passingScore = PERSENTASE (0-100), bukan poin absolut.
  // Lulus jika percentage >= passingScore.
  @ApiPropertyOptional({
    description: 'Nilai minimum kelulusan dalam persentase (0-100)',
    example: 75,
    default: 0,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  passingScore?: number;

  @ApiPropertyOptional({ description: 'Daftar pertanyaan' })
  @IsArray()
  @IsOptional()
  questions?: QuizQuestionDto[];
}

export class QuizAnswerDto {
  @ApiProperty({ description: 'Question ID / index', example: '0' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'Opsi yang dipilih', example: 'B' })
  @IsString()
  @IsNotEmpty()
  selectedAnswer: string;
}

export class SubmitQuizDto {
  @ApiProperty({ description: 'Jawaban mahasiswa', type: [QuizAnswerDto] })
  @IsArray()
  @IsNotEmpty()
  answers: QuizAnswerDto[];
}

// Simpan jawaban sementara saat attempt masih IN_PROGRESS (agar bisa
// dipulihkan setelah tab ditutup). Hanya questionId + selectedAnswer;
// isCorrect/points dihitung backend saat submit.
export class SaveQuizAnswersDto {
  @ApiProperty({
    description: 'Jawaban sementara (in-progress)',
    type: [QuizAnswerDto],
  })
  @IsArray()
  @IsNotEmpty()
  answers: QuizAnswerDto[];
}

// Lapor pelanggaran anti-cheat (deterrence/monitoring). Hanya event type +
// metadata minimal; identity dari JWT; occurredAt ditentukan SERVER.
// Frontend TIDAK boleh mengirim riskLevel/violationCount/userId/score.
export class ReportViolationDto {
  @ApiProperty({
    enum: QUIZ_VIOLATION_TYPES,
    example: 'TAB_HIDDEN',
    description: 'Tipe pelanggaran (enum)',
  })
  @IsEnum(QUIZ_VIOLATION_TYPES)
  @IsNotEmpty()
  type: QuizViolationType;

  @ApiPropertyOptional({
    description: 'Pertanyaan yang sedang dikerjakan (metadata saja)',
  })
  @IsString()
  @IsOptional()
  questionId?: string;
}

// Satu event dalam batch. `timestamp` client HANYA metadata (opsional) —
// occurredAt otoritatif tetap server time. Identity dari JWT, bukan body.
export class QuizEventDto {
  @ApiProperty({
    enum: QUIZ_VIOLATION_TYPES,
    example: 'TAB_HIDDEN',
    description: 'Tipe event (enum)',
  })
  @IsEnum(QUIZ_VIOLATION_TYPES)
  @IsNotEmpty()
  type: QuizViolationType;

  @ApiPropertyOptional({
    description:
      'Timestamp client (hanya metadata; server time tetap authority)',
  })
  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Pertanyaan yang sedang dikerjakan (metadata saja)',
  })
  @IsString()
  @IsOptional()
  questionId?: string;
}

// Batch event anti-cheat — maksimal 50 event/request (diatasnya 400).
export class ReportQuizEventsDto {
  @ApiProperty({
    description: 'Batch event anti-cheat (maks 50)',
    type: [QuizEventDto],
  })
  @IsArray()
  @ArrayMaxSize(QUIZ_EVENTS_MAX_PER_REQUEST)
  @ValidateNested({ each: true })
  @Type(() => QuizEventDto)
  events: QuizEventDto[];
}
