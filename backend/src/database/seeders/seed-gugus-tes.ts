import { connect, disconnect } from 'mongoose';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bemft_db';

// Gugus tes untuk UAT Pendamping — pendamping diisi oleh diha.23212@mhs.unesa.ac.id.
const PENDAMPING = {
  email: 'diha.23212@mhs.unesa.ac.id',
  name: 'Diha (Pendamping Tes)',
  nim: '23212',
  whatsapp: 'https://wa.me/6280000000000',
};

const TEST_MABA = [
  {
    name: 'Tes Maba 01',
    nim: '2699999101',
    gender: 'L',
    prodi: 'S1 Teknik Informatika',
  },
  {
    name: 'Tes Maba 02',
    nim: '2699999102',
    gender: 'P',
    prodi: 'S1 Teknik Informatika',
  },
  {
    name: 'Tes Maba 03',
    nim: '2699999103',
    gender: 'L',
    prodi: 'S1 Teknik Mesin',
  },
  {
    name: 'Tes Maba 04',
    nim: '2699999104',
    gender: 'P',
    prodi: 'S1 Teknik Elektro',
  },
  {
    name: 'Tes Maba 05',
    nim: '2699999105',
    gender: 'L',
    prodi: 'S1 Teknik Sipil',
  },
];

async function seed() {
  const conn = await connect(MONGODB_URI);
  console.log('🔌 Koneksi DB sukses.');
  const db = conn.connection.db!;

  const panitiaRole = await db.collection('roles').findOne({ slug: 'panitia' });
  const mabaRole = await db.collection('roles').findOne({ slug: 'user' });
  if (!panitiaRole || !mabaRole) {
    throw new Error(
      'Role panitia/user tidak ditemukan. Jalankan seed-rbac dulu.',
    );
  }

  const passwordPendamping = await bcrypt.hash('Pendamping2026!', 10);
  const passwordMaba = await bcrypt.hash('Password123!', 10);

  // ── 1. User Pendamping (diha) ─────────────────────────────────────────────
  const pendEmail = PENDAMPING.email.toLowerCase();
  const pendUser = await db.collection('users').findOne({ email: pendEmail });
  let pendId: string;
  if (pendUser) {
    pendId = pendUser._id.toString();
    console.log(
      `ℹ️  User pendamping ${pendEmail} sudah ada, update role → panitia.`,
    );
  } else {
    const res = await db.collection('users').insertOne({
      name: PENDAMPING.name,
      email: pendEmail,
      nim: PENDAMPING.nim,
      password: passwordPendamping,
      role: panitiaRole._id,
      division: 'Sie Pendamping',
      position: 'Pendamping Gugus',
      studyProgram: '',
      isActive: true,
      isOnboarded: true,
      isEmailVerified: true,
      avatar: '',
      cabinetPeriod: '2026',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    pendId = res.insertedId.toString();
    console.log(`✅ User pendamping ${pendEmail} dibuat.`);
  }

  // ── 2. Gugus Tes (nomor 51) ───────────────────────────────────────────────
  const gugus = await db.collection('pkkmb_gugus').findOneAndUpdate(
    { nomor: 51 },
    {
      $set: {
        nomor: 51,
        name: 'Tes',
        kapasitas: 60,
        status: 'ACTIVE',
        totalPoints: 0,
        pendampingId: new Types.ObjectId(pendId),
        pendampingName: PENDAMPING.name,
        pendampingWhatsApp: PENDAMPING.whatsapp,
        pendampingEmail: pendEmail,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );
  if (!gugus) throw new Error('Gagal membuat gugus Tes.');
  const gugusId = gugus._id;
  console.log(`✅ Gugus Tes (nomor 51) siap, pendampingId=${pendId}.`);

  // Hubungkan user pendamping ke gugus (dipakai otorisasi set-ketua & maba list).
  await db.collection('users').updateOne(
    { _id: new Types.ObjectId(pendId) },
    {
      $set: {
        pkkmbGroup: gugusId,
        role: panitiaRole._id,
        division: 'Sie Pendamping',
      },
    },
  );

  // ── 3. Maba anggota gugus ─────────────────────────────────────────────────
  const mabaIds: string[] = [];
  for (const m of TEST_MABA) {
    const email = `${m.nim}@mhs.unesa.ac.id`;
    const existing = (await db.collection('users').findOne({ email })) as {
      _id: Types.ObjectId;
      createdAt?: Date;
    } | null;
    const doc = {
      name: m.name,
      email,
      nim: m.nim,
      password: passwordMaba,
      role: mabaRole._id,
      division: 'Peserta',
      position: 'Mahasiswa Baru',
      studyProgram: m.prodi,
      gender: m.gender,
      isActive: true,
      isOnboarded: true,
      isEmailVerified: true,
      avatar: '',
      cabinetPeriod: '2026',
      pkkmbGroup: gugusId,
      assignmentStatus: 'ASSIGNED',
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    if (existing) {
      await db
        .collection('users')
        .updateOne({ _id: existing._id }, { $set: doc });
      mabaIds.push(existing._id.toString());
    } else {
      const res = await db.collection('users').insertOne(doc);
      mabaIds.push(res.insertedId.toString());
    }
  }
  console.log(`✅ ${mabaIds.length} maba tes masuk gugus Tes.`);

  // ── 4. Penetapan Ketua Gugus (maba pertama) ───────────────────────────────
  const ketuaId = mabaIds[0];
  await db
    .collection('pkkmb_gugus')
    .updateOne(
      { _id: gugusId },
      { $set: { ketuaGugusId: new Types.ObjectId(ketuaId) } },
    );
  await db
    .collection('users')
    .updateOne(
      { _id: new Types.ObjectId(ketuaId) },
      { $set: { isKetuaGugus: true } },
    );
  console.log(`✅ Ketua Gugus Tes ditetapkan (${TEST_MABA[0].name}).`);

  // ── 5. Sesi & Record Presensi (termasuk izin/sakit pending) ──────────────
  const session = await db.collection('pkkmb_attendance_sessions').findOne({
    title: 'Sesi Tes — Absensi Gugus',
  });
  let sessionId: string;
  if (session) {
    sessionId = session._id.toString();
  } else {
    const res = await db.collection('pkkmb_attendance_sessions').insertOne({
      title: 'Sesi Tes — Absensi Gugus',
      date: new Date(),
      startTime: new Date(),
      endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
      location: 'Gedung Dekanat FT UNESA',
      isOnline: false,
      targetParticipantType: 'MABA',
      status: 'PUBLISHED',
      createdBy: new Types.ObjectId(pendId),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    sessionId = res.insertedId.toString();
  }

  // Status beragam: hadir/telat + izin & sakit PENDING untuk uji verifikasi.
  const statusPlan = ['Hadir', 'Hadir', 'Telat', 'Izin', 'Sakit'];
  for (let i = 0; i < mabaIds.length; i++) {
    const status = statusPlan[i];
    const isIzin = status === 'Izin' || status === 'Sakit';
    await db.collection('pkkmb_attendance_records').findOneAndUpdate(
      {
        session: new Types.ObjectId(sessionId),
        participant: new Types.ObjectId(mabaIds[i]),
      },
      {
        $set: {
          session: new Types.ObjectId(sessionId),
          participant: new Types.ObjectId(mabaIds[i]),
          participantType: 'MABA',
          checkInTime: new Date(),
          status,
          attendanceMethod: 'MANUAL_OPERATOR',
          operator: new Types.ObjectId(pendId),
          izinStatus: isIzin ? 'PENDING' : 'NONE',
          reason: isIzin
            ? status === 'Izin'
              ? 'Ada urusan keluarga'
              : 'Sakit (surat dokter dilampirkan)'
            : '',
          proofUrl: isIzin ? 'https://example.com/surat-izin.jpg' : '',
        },
      },
      { upsert: true },
    );
  }
  console.log(
    '✅ Presensi sesi tes dibuat (Hadir, Telat, Izin & Sakit PENDING).',
  );

  // ── 6. Penugasan khusus gugus + pengumpulan ───────────────────────────────
  const task = await db.collection('pkkmbtasks').findOneAndUpdate(
    {
      title: 'Tes Tugas Gugus — Profil Singkat',
      targetType: 'GROUP',
      targetIds: [gugusId],
    },
    {
      $set: {
        title: 'Tes Tugas Gugus — Profil Singkat',
        description:
          'Buat profil singkat gugus (TASK untuk uji coba pendamping).',
        startTime: new Date(),
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        assignmentType: 'TASK',
        type: 'individu',
        status: 'PUBLISHED',
        targetType: 'GROUP',
        targetIds: [gugusId],
        allowedFormats: ['.pdf', '.jpg', '.png'],
        createdBy: new Types.ObjectId(pendId),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' },
  );
  if (!task) throw new Error('Gagal membuat penugasan gugus.');
  const taskId = task._id;

  // 2 maba sudah mengumpulkan → muncul di Evaluasi Penugasan pendamping.
  for (let i = 0; i < Math.min(2, mabaIds.length); i++) {
    await db.collection('pkkmbsubmissions').findOneAndUpdate(
      { taskId, userId: new Types.ObjectId(mabaIds[i]) },
      {
        $set: {
          taskId,
          userId: new Types.ObjectId(mabaIds[i]),
          fileUrl: `https://example.com/submission-${mabaIds[i]}.pdf`,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
  console.log('✅ Penugasan gugus & 2 pengumpulan dibuat.');

  await disconnect();
  console.log('🎉 Seeder Gugus Tes selesai!');
}

seed().catch((err) => {
  console.error('❌ Seeder Gugus Tes Error:', err);
  process.exit(1);
});
