/**
 * One-off dump script — download SEMUA data maba & gugus ke file Excel (.xlsx).
 *
 * Jalankan dari folder backend:
 *   npm run dump:maba-gugus
 *
 * (Opsional set env MONGODB_URI / MONGODB_DB untuk koneksi non-default.)
 * Menghasilkan:
 *   - ./dump/maba-pkkmb-full.xlsx  (semua maba, tanpa filter angkatan)
 *   - ./dump/gugus-pkkmb-full.xlsx (semua gugus + anggota)
 */
import { connect, disconnect, Types } from 'mongoose';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bemft_db';

interface MabaRow {
  NIM: string;
  Nama: string;
  Email: string;
  'Program Studi': string;
  Gender: string;
  Telepon: string;
  Angkatan: string;
  Gugus: string;
  'Nomor Gugus': string;
  'Status Onboarding': string;
  'Ketua Gugus': string;
  Disabilitas: string;
  'Deskripsi Disabilitas': string;
  'Kontak Darurat': string;
  'Ukuran Baju': string;
}

interface RawUser {
  _id: Types.ObjectId;
  nim?: string;
  name?: string;
  email?: string;
  studyProgram?: string;
  gender?: string;
  phone?: string;
  batch?: string;
  isOnboarded?: boolean;
  pkkmbGroup?: Types.ObjectId;
  emergencyContact?: string;
  shirtSize?: string;
  role: Types.ObjectId;
  deletedAt?: Date | null;
}

interface RawGroup {
  _id: Types.ObjectId;
  nomor?: number;
  name?: string;
  kapasitas?: number;
  status?: string;
  totalPoints?: number;
  pendampingName?: string;
  pendampingWhatsApp?: string;
  pendampingEmail?: string;
  pendampingId?: Types.ObjectId;
  ketuaGugusId?: Types.ObjectId;
}

interface RawHealthProfile {
  studentId: Types.ObjectId;
  isDisabled?: boolean;
  disabilityDescription?: string;
}

async function main() {
  console.log('🚀 Connecting to MongoDB:', MONGODB_URI);
  const conn = await connect(MONGODB_URI);
  const db = conn.connection.db;
  if (!db) throw new Error('Database connection failed.');

  const outDir = path.resolve('dump');
  fs.mkdirSync(outDir, { recursive: true });

  // ── Role maba (slug 'user', fallback 'maba') ─────────────────────────────
  const roleMaba = (await db
    .collection('roles')
    .findOne({ $or: [{ slug: 'user' }, { slug: 'maba' }] })) as {
    _id: Types.ObjectId;
  } | null;
  if (!roleMaba) {
    console.error('Role maba (slug user/maba) tidak ditemukan.');
    await disconnect();
    process.exit(1);
  }

  // ── 1. Data MABA (full) ──────────────────────────────────────────────────
  const users = (await db
    .collection('users')
    .find({ role: roleMaba._id, deletedAt: null })
    .toArray()) as unknown as RawUser[];

  const groupIds = users
    .map((u) => u.pkkmbGroup)
    .filter((g): g is Types.ObjectId => !!g)
    .map((g) => g.toString());
  const groups = (await db
    .collection('pkkmb_gugus')
    .find({ _id: { $in: groupIds.map((id) => new Types.ObjectId(id)) } })
    .toArray()) as unknown as RawGroup[];
  const groupMap = new Map(
    groups.map((g) => [g._id.toString(), g] as [string, RawGroup]),
  );
  const ketuaGroupIds = groups
    .filter((g) => g.ketuaGugusId)
    .map((g) => g.ketuaGugusId!.toString());
  const ketuaSet = new Set(ketuaGroupIds);

  const studentIds = users.map((u) => u._id);
  const healthProfiles = (await db
    .collection('health_profiles')
    .find({ studentId: { $in: studentIds } })
    .toArray()) as unknown as RawHealthProfile[];
  const healthMap = new Map(
    healthProfiles.map(
      (h) => [h.studentId.toString(), h] as [string, RawHealthProfile],
    ),
  );

  const mabaRows: MabaRow[] = users.map((u) => {
    const group = u.pkkmbGroup
      ? groupMap.get(u.pkkmbGroup.toString())
      : undefined;
    const health = u._id ? healthMap.get(u._id.toString()) : undefined;
    return {
      NIM: String(u.nim ?? ''),
      Nama: String(u.name ?? ''),
      Email: String(u.email ?? ''),
      'Program Studi': String(u.studyProgram ?? ''),
      Gender:
        u.gender === 'P' ? 'Perempuan' : u.gender === 'L' ? 'Laki-laki' : '',
      Telepon: String(u.phone ?? ''),
      Angkatan: String(u.batch ?? ''),
      Gugus: group?.name ?? 'Belum Dibagi',
      'Nomor Gugus': group?.nomor != null ? String(group.nomor) : '',
      'Status Onboarding': u.isOnboarded ? 'Lengkap' : 'Pending',
      'Ketua Gugus': ketuaSet.has(u._id.toString()) ? 'Ya' : 'Tidak',
      Disabilitas: health?.isDisabled ? 'Ya' : 'Tidak',
      'Deskripsi Disabilitas': String(health?.disabilityDescription ?? ''),
      'Kontak Darurat': String(u.emergencyContact ?? ''),
      'Ukuran Baju': String(u.shirtSize ?? ''),
    };
  });

  const mabaWs = XLSX.utils.json_to_sheet(mabaRows);
  mabaWs['!cols'] = [
    { wch: 18 },
    { wch: 32 },
    { wch: 34 },
    { wch: 28 },
    { wch: 12 },
    { wch: 18 },
    { wch: 10 },
    { wch: 26 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 40 },
    { wch: 20 },
    { wch: 12 },
  ];
  const mabaWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(mabaWb, mabaWs, 'Maba');
  const mabaPath = path.join(outDir, 'maba-pkkmb-full.xlsx');
  XLSX.writeFile(mabaWb, mabaPath);
  console.log(`✅ Data maba (${mabaRows.length}) → ${mabaPath}`);

  // ── 2. Data GUGUS (ringkasan + anggota) ──────────────────────────────────
  const allGroups = (await db
    .collection('pkkmb_gugus')
    .find({ deletedAt: null })
    .sort({ nomor: 1 })
    .toArray()) as unknown as RawGroup[];

  const summaryRows: Record<string, string | number>[] = [];
  const memberRows: Record<string, string | number>[] = [];

  for (const g of allGroups) {
    const pendamping = (await db
      .collection('users')
      .findOne({ _id: g.pendampingId })) as RawUser | null;
    const ketua = g.ketuaGugusId
      ? ((await db
          .collection('users')
          .findOne({ _id: g.ketuaGugusId })) as RawUser | null)
      : null;
    const members = (await db
      .collection('users')
      .find({ pkkmbGroup: g._id, deletedAt: null })
      .sort({ name: 1 })
      .toArray()) as unknown as RawUser[];

    summaryRows.push({
      Nomor: g.nomor ?? 0,
      'Nama Gugus': g.name ?? '',
      Kapasitas: g.kapasitas ?? 0,
      'Total Anggota': members.length,
      Pendamping: pendamping?.name ?? g.pendampingName ?? '',
      'WA Pendamping': g.pendampingWhatsApp ?? '',
      'Email Pendamping': g.pendampingEmail ?? '',
      'Ketua Gugus': ketua?.name ?? '',
      Status: g.status ?? '',
      'Total Poin': g.totalPoints ?? 0,
    });

    for (const m of members) {
      memberRows.push({
        'Nomor Gugus': g.nomor ?? 0,
        'Nama Gugus': g.name ?? '',
        'Nama Maba': m.name ?? '',
        NIM: m.nim ?? '',
        Email: m.email ?? '',
        'Program Studi': m.studyProgram ?? '',
        Gender:
          m.gender === 'P' ? 'Perempuan' : m.gender === 'L' ? 'Laki-laki' : '',
        Telepon: m.phone ?? '',
      });
    }
  }

  const sumWs = XLSX.utils.json_to_sheet(summaryRows);
  sumWs['!cols'] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 10 },
    { wch: 13 },
    { wch: 26 },
    { wch: 22 },
    { wch: 30 },
    { wch: 26 },
    { wch: 10 },
    { wch: 12 },
  ];
  const memberWs = XLSX.utils.json_to_sheet(memberRows);
  memberWs['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 32 },
    { wch: 18 },
    { wch: 34 },
    { wch: 28 },
    { wch: 12 },
    { wch: 18 },
  ];
  const gugusWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(gugusWb, sumWs, 'Ringkasan Gugus');
  XLSX.utils.book_append_sheet(gugusWb, memberWs, 'Anggota Gugus');
  const gugusPath = path.join(outDir, 'gugus-pkkmb-full.xlsx');
  XLSX.writeFile(gugusWb, gugusPath);
  console.log(
    `✅ Data gugus (${allGroups.length} gugus, ${memberRows.length} anggota) → ${gugusPath}`,
  );

  await disconnect();
  console.log('🎉 Selesai.');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
