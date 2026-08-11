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

// Helper tanggal relatif terhadap sekarang agar seed selalu "masa depan".
const daysFromNow = (days: number, hour = 8, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// ─── SESI PRESENSI ──────────────────────────────────────────────────────────
const SESSIONS = [
  {
    key: 'hari1-registrasi',
    title: 'Hari 1 — Registrasi & Check-in Pagi',
    dateOffset: 1,
    startHour: 7,
    startMinute: 0,
    endHour: 10,
    endMinute: 0,
    location: 'Gedung Dekanat FT UNESA',
    target: 'ALL' as const,
  },
  {
    key: 'hari1-opening',
    title: 'Hari 1 — Opening Ceremony & Sambutan',
    dateOffset: 1,
    startHour: 10,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    location: 'Auditorium FT UNESA',
    target: 'ALL' as const,
  },
  {
    key: 'hari2-materi',
    title: 'Hari 2 — Materi Kehidupan Kampus',
    dateOffset: 2,
    startHour: 8,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    location: 'Ruang Sidang Lantai 3 Gedung Dekanat',
    target: 'MABA' as const,
  },
  {
    key: 'hari3-penutup',
    title: 'Hari 3 — Penutupan & Pembagian Gugus',
    dateOffset: 3,
    startHour: 8,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    location: 'Lapangan FT UNESA',
    target: 'ALL' as const,
  },
];

// ─── PENUGASAN (TASK) ───────────────────────────────────────────────────────
const TASKS = [
  {
    title: 'Pengumpulan Berkas Biodata & Pasfoto Digital',
    description:
      'Unggah pasfoto 3x4 (latar merah, kemeja putih) dan salinan KTMS dalam satu file PDF/ZIP. Pastikan nama file memuat NIM Anda.',
    type: 'individu',
    deadlineOffset: 2,
    status: 'PUBLISHED',
    targetType: 'ALL',
    allowedFormats: ['.pdf', '.zip', '.jpg', '.jpeg', '.png'],
  },
  {
    title: 'Tugas Kelompok — Profil & Yel-yel Gugus',
    description:
      'Bersama ketua gugus, buat video yel-yel gugus berdurasi 60 detik beserta profil singkat anggota. Unggah link Google Drive (publik/editor).',
    type: 'kelompok',
    deadlineOffset: 4,
    status: 'PUBLISHED',
    targetType: 'ALL',
    allowedFormats: ['.txt', '.md', '.pdf'],
    isLink: true,
  },
  {
    title: 'Refleksi Materi Hari 2 (Esai Singkat)',
    description:
      'Tulis refleksi 1 halaman tentang materi "Kehidupan Kampus & Organisasi" yang disampaikan pada Hari 2. Unggah dalam format PDF.',
    type: 'individu',
    deadlineOffset: 5,
    status: 'PUBLISHED',
    targetType: 'ALL',
    allowedFormats: ['.pdf', '.doc', '.docx'],
  },
];

// ─── QUIZ ───────────────────────────────────────────────────────────────────
const QUIZZES = [
  {
    title: 'Pretest PKKMB FT UNESA 2026',
    description:
      'Pretest untuk mengukur pengetahuan awal mahasiswa baru tentang kampus dan PKKMB. Kerjakan dengan jujur.',
    type: 'PRETEST',
    status: 'PUBLISHED',
    durationMinutes: 15,
    maxAttempts: 2,
    passingScore: 60,
    startOffset: 1,
    endOffset: 8,
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
        question: 'Berapa jumlah gugus PKKMB Adrata FT UNESA 2026?',
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
        question: 'Siapa yang menjadi penanggung jawab utama kegiatan PKKMB FT?',
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
      {
        question: 'Mahasiswa baru wajib mengikuti rangkaian PKKMB sebagai syarat...',
        options: [
          { id: 'a', text: 'Penerimaan beasiswa' },
          { id: 'b', text: 'Pengenalan & pembekalan kehidupan kampus' },
          { id: 'c', text: 'Pendaftaran ulang semester' },
          { id: 'd', text: 'Pembuatan KTM' },
        ],
        correctAnswer: 'b',
        points: 10,
      },
      {
        question: 'Apa tujuan utama pembagian mahasiswa ke dalam gugus?',
        options: [
          { id: 'a', text: 'Memudahkan administrasi panitia' },
          { id: 'b', text: 'Meratakan komposisi prodi & gender' },
          { id: 'c', text: 'Membentuk kelompok belajar' },
          { id: 'd', text: 'Menentukan asrama' },
        ],
        correctAnswer: 'b',
        points: 10,
      },
      {
        question: 'Sikap yang harus dihindari selama PKKMB adalah...',
        options: [
          { id: 'a', text: 'Tertib dan disiplin' },
          { id: 'b', text: 'Perundungan (bullying)' },
          { id: 'c', text: 'Aktif bertanya' },
          { id: 'd', text: 'Menghargai sesama' },
        ],
        correctAnswer: 'b',
        points: 10,
      },
      {
        question: 'Media komunikasi resmi info PKKMB kepada maba adalah...',
        options: [
          { id: 'a', text: 'Media sosial pribadi' },
          { id: 'b', text: 'Portal Digital Ecosystem BEM FT' },
          { id: 'c', text: 'Grup kelas' },
          { id: 'd', text: 'Papan pengumuman kampus' },
        ],
        correctAnswer: 'b',
        points: 10,
      },
    ],
  },
  {
    title: 'Posttest PKKMB FT UNESA 2026',
    description:
      'Posttest untuk mengukur pemahaman setelah seluruh rangkaian PKKMB. Jawaban dinilai otomatis.',
    type: 'POSTTEST',
    status: 'PUBLISHED',
    durationMinutes: 10,
    maxAttempts: 1,
    passingScore: 70,
    startOffset: 5,
    endOffset: 10,
    questions: [
      {
        question: 'Setelah PKKMB, maba diharapkan mampu...',
        options: [
          { id: 'a', text: 'Menghafal seluruh pengurus BEM' },
          { id: 'b', text: 'Beradaptasi dan berintegritas di kehidupan kampus' },
          { id: 'c', text: 'Langsung menjadi panitia' },
          { id: 'd', text: 'Mendapat IPK 4.0' },
        ],
        correctAnswer: 'b',
        points: 20,
      },
      {
        question: 'Nilai dan etika yang ditekankan selama PKKMB adalah...',
        options: [
          { id: 'a', text: 'Kompetisi dan rivalitas' },
          { id: 'b', text: 'Kekerasan dan senioritas' },
          { id: 'c', text: 'Gotong royong, integritas, dan saling menghargai' },
          { id: 'd', text: 'Individualisme' },
        ],
        correctAnswer: 'c',
        points: 20,
      },
      {
        question: 'Jika menemui kendala selama PKKMB, maba dapat menghubungi...',
        options: [
          { id: 'a', text: 'Pendamping gugus atau Tim IT PKKMB' },
          { id: 'b', text: 'Media sosial pribadi' },
          { id: 'c', text: 'Karang taruna' },
          { id: 'd', text: 'Tidak perlu melapor' },
        ],
        correctAnswer: 'a',
        points: 20,
      },
      {
        question: 'Sistem presensi PKKMB dilakukan melalui...',
        options: [
          { id: 'a', text: 'Tanda tangan manual' },
          { id: 'b', text: 'Scan QR code pada portal resmi' },
          { id: 'c', text: 'Absen di grup WA' },
          { id: 'd', text: 'Laporan lisan' },
        ],
        correctAnswer: 'b',
        points: 20,
      },
      {
        question: 'Pembagian gugus dilakukan agar setiap gugus...',
        options: [
          { id: 'a', text: 'Berisi mahasiswa dari prodi yang sama' },
          { id: 'b', text: 'Memiliki komposisi prodi & gender yang seimbang' },
          { id: 'c', text: 'Hanya berisi satu gender' },
          { id: 'd', text: 'Didasarkan pada asal daerah' },
        ],
        correctAnswer: 'b',
        points: 20,
      },
    ],
  },
];

async function seed() {
  const conn = await connect(MONGODB_URI);
  console.log('🔌 Koneksi DB sukses.');
  const db = conn.connection.db!;

  // Cari createdBy dari user yang sudah ada.
  const findUser = async (email: string) => {
    const u = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!u) {
      throw new Error(
        `User "${email}" tidak ditemukan. Jalankan seed-rbac terlebih dahulu.`,
      );
    }
    return u;
  };

  // ── 1. Sesi Presensi ──────────────────────────────────────
  console.log('🕐 Seeding sesi presensi...');
  const userAcara = await findUser(CREATED_BY_ACARA);
  let sessionsCreated = 0;
  for (const s of SESSIONS) {
    const date = daysFromNow(s.dateOffset, s.startHour, s.startMinute);
    const startTime = new Date(date);
    const endTime = daysFromNow(s.dateOffset, s.endHour, s.endMinute);
    const existing = await db.collection('pkkmb_attendance_sessions').findOne({
      title: s.title,
      deletedAt: null,
    });
    if (existing) continue;
    await db.collection('pkkmb_attendance_sessions').insertOne({
      title: s.title,
      date,
      startTime,
      endTime,
      location: s.location,
      isOnline: false,
      targetParticipantType: s.target,
      status: 'PUBLISHED',
      createdBy: userAcara._id,
    });
    sessionsCreated++;
  }
  console.log(`✅ Sesi presensi dibuat: ${sessionsCreated}.`);

  // ── 2. Penugasan (TASK) ───────────────────────────────────
  console.log('📝 Seeding penugasan...');
  const userPelaksana = await findUser(CREATED_BY_PELAKSANA);
  let tasksCreated = 0;
  for (const t of TASKS) {
    const existing = await db.collection('pkkmb_tasks').findOne({
      title: t.title,
      deletedAt: null,
    });
    if (existing) continue;
    const doc: Record<string, unknown> = {
      title: t.title,
      description: t.description,
      deadline: daysFromNow(t.deadlineOffset, 23, 59),
      assignmentType: 'TASK',
      type: t.type,
      status: t.status,
      targetType: t.targetType,
      targetIds: [],
      allowedFormats: t.allowedFormats,
      createdBy: userPelaksana._id,
    };
    if (t.isLink) doc.link = 'https://drive.google.com/';
    await db.collection('pkkmb_tasks').insertOne(doc);
    tasksCreated++;
  }
  console.log(`✅ Penugasan dibuat: ${tasksCreated}.`);

  // ── 3. Quiz ───────────────────────────────────────────────
  console.log('📊 Seeding quiz...');
  let quizzesCreated = 0;
  for (const q of QUIZZES) {
    const existing = await db.collection('pkkmb_quizzes').findOne({
      title: q.title,
      deletedAt: null,
    });
    if (existing) continue;
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
      startTime: daysFromNow(q.startOffset, 0, 0),
      endTime: daysFromNow(q.endOffset, 23, 59),
      durationMinutes: q.durationMinutes,
      maxAttempts: q.maxAttempts,
      passingScore: q.passingScore,
      createdBy: userPelaksana._id,
    });
    const quizId = res.insertedId;

    // Hubungkan quiz ke penugasan tipe QUIZ (pretest/posttest sebagai
    // assignment container agar tampil di dashboard maba).
    await db.collection('pkkmb_tasks').insertOne({
      title: `${q.title} (Penugasan)`,
      description: q.description,
      deadline: daysFromNow(q.endOffset, 23, 59),
      assignmentType: 'QUIZ',
      quizId: new Types.ObjectId(quizId.toString()),
      status: 'PUBLISHED',
      targetType: 'ALL',
      targetIds: [],
      allowedFormats: [],
      createdBy: userPelaksana._id,
    });
    quizzesCreated++;
  }
  console.log(`✅ Quiz dibuat: ${quizzesCreated}.`);

  await disconnect();
  console.log('🎉 Seed konten PKKMB (presensi, penugasan, quiz) selesai!');
}

seed().catch((err) => {
  console.error('❌ Seed konten PKKMB Error:', err);
  process.exit(1);
});
