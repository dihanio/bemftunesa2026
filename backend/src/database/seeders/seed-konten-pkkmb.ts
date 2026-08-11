import { connect, disconnect } from 'mongoose';
import * as dotenv from 'dotenv';
import { Types } from 'mongoose';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bemft_db';

// ─── KONFIGURASI ────────────────────────────────────────────────────────────
// Email admin/panitia yang berperan sbg `createdBy` (harus sudah ada di DB via
// seed-rbac). Ubah bila perlu.
const CREATED_BY_ACARA = 'koor.acara@unesa.ac.id';
const CREATED_BY_PELAKSANA = 'ketua.pelaksana@unesa.ac.id';

// ─── JENDELA WAKTU: PRA-PKKMB FT (Tes Maba) ─────────────────────────────────
// Seed ini MENGHAPUS data konten PKKMB lama (presensi, penugasan, quiz beserta
// submission/attempt terkait) lalu men-seed ulang data TES untuk Pra-PKKMB.
// Jendela aktif: SEKARANG s.d. AKHIR BESOK (tanggal 12) — jadi maba sudah bisa
// mencoba hari ini dan selama acara Pra-PKKMB besok.
const now = new Date();
const startOfToday = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();
// Akhir besok (tanggal 12) 23:59:59.999
const endOfEvent = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 59, 999);
  return d;
})();
// Tanggal acara (besok = tanggal 12) — dipakai sbg field `date` presensi.
const eventDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
})();

console.log(
  `🕒 Jendela seed: ${now.toISOString()} → ${endOfEvent.toISOString()}`,
);

// ─── SESI PRESENSI (Tes Pra-PKKMB) ──────────────────────────────────────────
const SESSIONS = [
  {
    title: 'Pra-PKKMB FT UNESA — Registrasi & Tes Presensi',
    startTime: startOfToday,
    endTime: endOfEvent,
    location: 'Gedung Dekanat FT UNESA',
    target: 'ALL' as const,
  },
];

// ─── PENUGASAN (TASK) TES ───────────────────────────────────────────────────
const TASKS = [
  {
    title: 'Tes Pengumpulan — Pasfoto & Biodata Digital',
    description:
      'Unggah pasfoto 3x4 (latar merah, kemeja putih) dan salinan KTMS dalam satu file PDF/ZIP. Pastikan nama file memuat NIM Anda. Tugas ini untuk uji coba alur pengumpulan sebelum PKKMB.',
    type: 'individu',
    status: 'PUBLISHED',
    targetType: 'ALL',
    allowedFormats: ['.pdf', '.zip', '.jpg', '.jpeg', '.png'],
  },
  {
    title: 'Tes Tugas Kelompok — Profil Singkat Gugus',
    description:
      'Bersama anggota gugus, buat profil singkat beserta yel-yel gugus (durasi maks. 60 detik). Unggah link Google Drive (publik/editor). Ini untuk uji coba alur tugas kelompok.',
    type: 'kelompok',
    status: 'PUBLISHED',
    targetType: 'ALL',
    allowedFormats: ['.txt', '.md', '.pdf'],
    isLink: true,
  },
];

// ─── QUIZ PRETEST (Tes Pra-PKKMB) ───────────────────────────────────────────
const QUIZZES = [
  {
    title: 'Pretest Pra-PKKMB FT UNESA 2026 (Tes Sistem)',
    description:
      'Pretest untuk mengukur pengetahuan awal mahasiswa baru tentang kampus dan PKKMB. Kerjakan dengan jujur. Quiz ini untuk uji coba sistem sebelum PKKMB.',
    type: 'PRETEST',
    status: 'PUBLISHED',
    durationMinutes: 15,
    maxAttempts: 2,
    passingScore: 60,
    startTime: startOfToday,
    endTime: endOfEvent,
    questions: [
      {
        question: 'Apa nama kabinet BEM FT UNESA 2026?',
        options: [
          { id: 'a', text: 'Kabinet Sinergi' },
          { id: 'b', text: 'Kabinet Danadyaksa' },
          { id: 'c', text: 'Kabinet Nusantara' },
          { id: 'd', text: 'Kabinet Adhikarya' },
        ],
        correctAnswer: 'b',
        points: 10,
      },
      {
        question: 'Dekan Fakultas Teknik UNESA bertanggung jawab kepada...',
        options: [
          { id: 'a', text: 'Menteri Pendidikan' },
          { id: 'b', text: 'Rektor UNESA' },
          { id: 'c', text: 'Gubernur Jawa Timur' },
          { id: 'd', text: 'Kemendikbudristek' },
        ],
        correctAnswer: 'b',
        points: 10,
      },
      {
        question: 'Berapa jumlah gugus PKKMB FT UNESA 2026?',
        options: [
          { id: 'a', text: '40' },
          { id: 'b', text: '45' },
          { id: 'c', text: '50' },
          { id: 'd', text: '55' },
        ],
        correctAnswer: 'c',
        points: 10,
      },
      {
        question: 'Sistem informasi resmi yang dipakai BEM FT UNESA disebut...',
        options: [
          { id: 'a', text: 'BEM Apps' },
          { id: 'b', text: 'Digital Ecosystem BEM FT' },
          { id: 'c', text: 'FT Online' },
          { id: 'd', text: 'Kampusku' },
        ],
        correctAnswer: 'b',
        points: 10,
      },
      {
        question:
          'Siapa yang menjadi penanggung jawab utama kegiatan PKKMB FT?',
        options: [
          { id: 'a', text: 'Pendamping Gugus' },
          { id: 'b', text: 'Koor. Sie Acara' },
          { id: 'c', text: 'Ketua Pelaksana' },
          { id: 'd', text: 'Mentor' },
        ],
        correctAnswer: 'c',
        points: 10,
      },
      {
        question: 'Lokasi utama kegiatan PKKMB FT UNESA berada di...',
        options: [
          { id: 'a', text: 'Kampus Lidah Wetan' },
          { id: 'b', text: 'Kampus Ketintang' },
          { id: 'c', text: 'Kampus Surabaya Timur' },
          { id: 'd', text: 'Kampus Gresik' },
        ],
        correctAnswer: 'a',
        points: 10,
      },
    ],
  },
];

// Koleksi yang isinya DIBERSIHKAN (hapus data konten PKKMB lama) lalu di-seed
// ulang. Nama collection sesuai schema mongoose (default plural lowercase untuk
// task/submission; collection explicit untuk attendance/quiz).
const CONTENT_COLLECTIONS = [
  'pkkmb_attendance_sessions',
  'pkkmb_attendance_records',
  'pkkmbtasks',
  'pkkmbsubmissions',
  'pkkmb_quizzes',
  'pkkmb_quiz_attempts',
  'pkkmb_announcements',
];

async function seed() {
  const conn = await connect(MONGODB_URI);
  console.log('🔌 Koneksi DB sukses.');
  const db = conn.connection.db!;

  // Cari createdBy dari user yang sudah ada.
  const findUser = async (email: string) => {
    const u = await db
      .collection('users')
      .findOne({ email: email.toLowerCase() });
    if (!u) {
      throw new Error(
        `User "${email}" tidak ditemukan. Jalankan seed-rbac terlebih dahulu.`,
      );
    }
    return u;
  };

  // ── 0. Hapus data konten PKKMB lama ─────────────────────
  console.log('🧹 Menghapus data konten PKKMB sebelumnya...');
  for (const name of CONTENT_COLLECTIONS) {
    const { deletedCount } = await db.collection(name).deleteMany({});
    console.log(`🗑️  Bersihkan ${name}: ${deletedCount} dokumen dihapus.`);
  }
  console.log('✅ Data lama dibersihkan.');

  // ── 1. Sesi Presensi ──────────────────────────────────────
  console.log('🕐 Seeding sesi presensi (tes)...');
  const userAcara = await findUser(CREATED_BY_ACARA);
  let sessionsCreated = 0;
  let sessionId: Types.ObjectId | null = null;
  for (const s of SESSIONS) {
    const res = await db.collection('pkkmb_attendance_sessions').insertOne({
      title: s.title,
      date: eventDate,
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location,
      isOnline: false,
      targetParticipantType: s.target,
      status: 'PUBLISHED',
      createdBy: userAcara._id,
    });
    sessionId = new Types.ObjectId(res.insertedId.toString());
    sessionsCreated++;
  }
  console.log(`✅ Sesi presensi dibuat: ${sessionsCreated}.`);

  // ── 2. Penugasan (TASK) ───────────────────────────────────
  console.log('📝 Seeding penugasan (tes)...');
  const userPelaksana = await findUser(CREATED_BY_PELAKSANA);
  let tasksCreated = 0;
  // Simpan ID tugas per index agar bisa dipakai sbg actionId pengumuman.
  const taskIds: Types.ObjectId[] = [];
  for (const t of TASKS) {
    const doc: Record<string, unknown> = {
      title: t.title,
      description: t.description,
      startTime: startOfToday,
      deadline: endOfEvent,
      assignmentType: 'TASK',
      type: t.type,
      status: t.status,
      targetType: t.targetType,
      targetIds: [],
      allowedFormats: t.allowedFormats,
      createdBy: userPelaksana._id,
    };
    if (t.isLink) doc.link = 'https://drive.google.com/';
    const res = await db.collection('pkkmbtasks').insertOne(doc);
    taskIds.push(new Types.ObjectId(res.insertedId.toString()));
    tasksCreated++;
  }
  console.log(`✅ Penugasan dibuat: ${tasksCreated}.`);

  // ── 3. Quiz ───────────────────────────────────────────────
  console.log('📊 Seeding quiz (tes)...');
  let quizzesCreated = 0;
  // Hoist utk dipakai sbg actionId pengumuman setelah loop.
  let quizId: Types.ObjectId | null = null;
  for (const q of QUIZZES) {
    const questions = q.questions.map((qs, i) => ({
      ...qs,
      order: i + 1,
    }));
    const res = await db.collection('pkkmb_quizzes').insertOne({
      title: q.title,
      description: q.description,
      type: q.type,
      status: q.status,
      questions,
      targetType: 'ALL',
      targetIds: [],
      startTime: q.startTime,
      endTime: q.endTime,
      durationMinutes: q.durationMinutes,
      maxAttempts: q.maxAttempts,
      passingScore: q.passingScore,
      createdBy: userPelaksana._id,
    });
    quizId = new Types.ObjectId(res.insertedId.toString());

    // Hubungkan quiz ke penugasan tipe QUIZ agar tampil di dashboard maba.
    await db.collection('pkkmbtasks').insertOne({
      title: `${q.title} (Penugasan)`,
      description: q.description,
      startTime: startOfToday,
      deadline: q.endTime,
      assignmentType: 'QUIZ',
      quizId,
      status: 'PUBLISHED',
      targetType: 'ALL',
      targetIds: [],
      allowedFormats: [],
      createdBy: userPelaksana._id,
    });
    quizzesCreated++;
  }
  console.log(`✅ Quiz dibuat: ${quizzesCreated}.`);

  // ── 4. Pengumuman (dgn aksi deep-link) ────────────────────
  // actionType/actionId dipakai halaman Notifikasi MABA utk tombol aksi:
  //   quiz → /dashboard/quiz/:actionId
  //   task → /dashboard/assignments/:actionId
  //   attendance → /dashboard/presensi
  console.log('📣 Seeding pengumuman (dgn aksi)...');
  const announcements = [
    {
      title: 'Pretest Pra-PKKMB Sudah Tersedia',
      content:
        'Kerjakan pretest uji sistem sebelum acara. Batas waktu besok pukul 23:59 WIB.',
      actionType: 'quiz',
      actionId: quizId?.toString() ?? '',
      isPriority: true,
    },
    {
      title: 'Tes Pengumpulan Tugas Dimulai',
      content:
        'Unggah pasfoto & biodata digital kamu lewat menu Aktivitas sebelum batas waktu.',
      actionType: 'task',
      actionId: taskIds[0]?.toString() ?? '',
      isPriority: false,
    },
    {
      title: 'Presensi Pra-PKKMB Dibuka',
      content:
        'Lakukan presensi mandiri dengan selfie pada hari acara melalui menu Presensi.',
      actionType: 'attendance',
      actionId: sessionId?.toString() ?? '',
      isPriority: false,
    },
  ];
  let announcementsCreated = 0;
  for (const a of announcements) {
    await db.collection('pkkmb_announcements').insertOne({
      title: a.title,
      content: a.content,
      attachments: [],
      targetAudience: 'all',
      isPriority: a.isPriority,
      status: 'PUBLISHED',
      actionType: a.actionType,
      actionId: a.actionId,
    });
    announcementsCreated++;
  }
  console.log(`✅ Pengumuman dibuat: ${announcementsCreated}.`);

  await disconnect();
  console.log(
    '🎉 Seed konten PKKMB (presensi, penugasan, quiz, pengumuman) untuk Pra-PKKMB FT selesai!',
  );
}

seed().catch((err) => {
  console.error('❌ Seed konten PKKMB Error:', err);
  process.exit(1);
});
