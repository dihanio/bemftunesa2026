import { connect, disconnect } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bemft_db';

const PERMISSIONS_DATA = [
  {
    name: 'manage:all',
    resource: 'system',
    action: 'manage',
    description: 'Akses penuh seluruh sistem (Super Admin)',
  },

  // System & Monitoring
  {
    name: 'pkkmb.monitoring.read',
    resource: 'monitoring',
    action: 'read',
    description: 'Melihat dashboard & statistik monitoring',
  },
  {
    name: 'pkkmb.audit.read',
    resource: 'audit',
    action: 'read',
    description: 'Melihat audit log sistem',
  },
  {
    name: 'pkkmb.settings.manage',
    resource: 'settings',
    action: 'manage',
    description: 'Mengelola pengaturan portal PKKMB',
  },

  // Role & Permission Management
  {
    name: 'pkkmb.roles.read',
    resource: 'roles',
    action: 'read',
    description: 'Melihat daftar role',
  },
  {
    name: 'pkkmb.roles.manage',
    resource: 'roles',
    action: 'manage',
    description: 'Membuat, mengubah, dan menghapus role',
  },
  {
    name: 'pkkmb.permissions.read',
    resource: 'permissions',
    action: 'read',
    description: 'Melihat daftar permission',
  },
  {
    name: 'pkkmb.users.manage',
    resource: 'users',
    action: 'manage',
    description: 'Mengelola data akun pengguna',
  },

  // Announcements
  {
    name: 'pkkmb.announcement.read',
    resource: 'announcement',
    action: 'read',
    description: 'Melihat pengumuman',
  },
  {
    name: 'pkkmb.announcement.create',
    resource: 'announcement',
    action: 'create',
    description: 'Membuat draf pengumuman',
  },
  {
    name: 'pkkmb.announcement.update',
    resource: 'announcement',
    action: 'update',
    description: 'Mengubah pengumuman',
  },
  {
    name: 'pkkmb.announcement.delete',
    resource: 'announcement',
    action: 'delete',
    description: 'Menghapus pengumuman',
  },
  {
    name: 'pkkmb.announcement.publish',
    resource: 'announcement',
    action: 'publish',
    description: 'Memublikasikan pengumuman',
  },
  {
    name: 'pkkmb.announcement.broadcast',
    resource: 'announcement',
    action: 'broadcast',
    description: 'Penyiaran pengumuman penting',
  },

  // Schedules
  {
    name: 'pkkmb.schedule.read',
    resource: 'schedule',
    action: 'read',
    description: 'Melihat linimasa & jadwal kegiatan',
  },
  {
    name: 'pkkmb.schedule.create',
    resource: 'schedule',
    action: 'create',
    description: 'Membuat jadwal kegiatan baru',
  },
  {
    name: 'pkkmb.schedule.update',
    resource: 'schedule',
    action: 'update',
    description: 'Mengubah jadwal kegiatan',
  },
  {
    name: 'pkkmb.schedule.delete',
    resource: 'schedule',
    action: 'delete',
    description: 'Menghapus jadwal kegiatan',
  },
  {
    name: 'pkkmb.schedule.publish',
    resource: 'schedule',
    action: 'publish',
    description: 'Memublikasikan jadwal kegiatan',
  },

  // Grading & Tasks
  {
    name: 'pkkmb.grading.read_all',
    resource: 'grading',
    action: 'read_all',
    description: 'Melihat seluruh nilai peserta',
  },
  {
    name: 'pkkmb.grading.read_own',
    resource: 'grading',
    action: 'read_own',
    description: 'Melihat nilai kelompok/sendiri',
  },
  {
    name: 'pkkmb.grading.create',
    resource: 'grading',
    action: 'create',
    description: 'Input nilai penugasan',
  },
  {
    name: 'pkkmb.grading.update',
    resource: 'grading',
    action: 'update',
    description: 'Mengubah nilai penugasan',
  },
  {
    name: 'pkkmb.grading.export',
    resource: 'grading',
    action: 'export',
    description: 'Ekspor rekapitulasi nilai',
  },
  {
    name: 'pkkmb.grading.statistics',
    resource: 'grading',
    action: 'statistics',
    description: 'Melihat statistik nilai & grafik',
  },

  {
    name: 'pkkmb.task.read',
    resource: 'task',
    action: 'read',
    description: 'Melihat daftar penugasan',
  },
  {
    name: 'pkkmb.task.create',
    resource: 'task',
    action: 'create',
    description: 'Membuat tugas baru',
  },
  {
    name: 'pkkmb.task.update',
    resource: 'task',
    action: 'update',
    description: 'Mengubah tugas',
  },
  {
    name: 'pkkmb.task.delete',
    resource: 'task',
    action: 'delete',
    description: 'Menghapus tugas',
  },
  {
    name: 'pkkmb.task.submit',
    resource: 'task',
    action: 'submit',
    description: 'Mengumpulkan tugas',
  },

  // Groups & Pendampingan
  {
    name: 'pkkmb.group.read_all',
    resource: 'group',
    action: 'read_all',
    description: 'Melihat seluruh kelompok PKKMB',
  },
  {
    name: 'pkkmb.group.read_own',
    resource: 'group',
    action: 'read_own',
    description: 'Melihat kelompok binaan sendiri',
  },
  {
    name: 'pkkmb.group.create',
    resource: 'group',
    action: 'create',
    description: 'Membuat kelompok baru',
  },
  {
    name: 'pkkmb.group.update',
    resource: 'group',
    action: 'update',
    description: 'Mengubah data kelompok',
  },
  {
    name: 'pkkmb.group.assign_mentor',
    resource: 'group',
    action: 'assign_mentor',
    description: 'Penetapan pendamping kelompok',
  },

  // Universal Attendance
  {
    name: 'pkkmb.attendance.read',
    resource: 'attendance',
    action: 'read',
    description: 'Melihat laporan presensi',
  },
  {
    name: 'pkkmb.attendance.session_create',
    resource: 'attendance',
    action: 'session_create',
    description: 'Membuat sesi presensi universal',
  },
  {
    name: 'pkkmb.attendance.checkin',
    resource: 'attendance',
    action: 'checkin',
    description: 'Melakukan check-in presensi',
  },

  // Registration & Operator
  {
    name: 'pkkmb.registration.verify',
    resource: 'registration',
    action: 'verify',
    description: 'Verifikasi berkas pendaftaran Maba',
  },
  {
    name: 'pkkmb.registration.manage',
    resource: 'registration',
    action: 'manage',
    description: 'Kelola verifikasi dan pengumuman status Maba',
  },
  {
    name: 'pkkmb.registration.checkin',
    resource: 'registration',
    action: 'checkin',
    description: 'Presensi check-in lokasi Hari-H',
  },
  {
    name: 'pkkmb.registration.edit_biodata',
    resource: 'registration',
    action: 'edit_biodata',
    description: 'Edit biodata Maba di lokasi',
  },
  {
    name: 'pkkmb.registration.upload_document',
    resource: 'registration',
    action: 'upload_document',
    description: 'Bantu upload berkas Maba',
  },
  {
    name: 'pkkmb.group.publish',
    resource: 'group',
    action: 'publish',
    description: 'Publish hasil assignment gugus',
  },

  // Profile
  {
    name: 'pkkmb.profile.read_own',
    resource: 'profile',
    action: 'read_own',
    description: 'Melihat profil sendiri',
  },
  {
    name: 'pkkmb.profile.update_own',
    resource: 'profile',
    action: 'update_own',
    description: 'Mengubah password/profil sendiri',
  },
  {
    name: 'pkkmb.profile.read_all',
    resource: 'profile',
    action: 'read_all',
    description: 'Melihat seluruh data profil',
  },
];

async function seed() {
  console.log('🚀 Connecting to MongoDB:', MONGODB_URI);
  const conn = await connect(MONGODB_URI);
  const db = conn.connection.db;

  if (!db) {
    throw new Error('Database connection failed.');
  }

  console.log('📦 Seeding Permissions...');
  const permissionMap = new Map<string, unknown>();

  for (const perm of PERMISSIONS_DATA) {
    const res = await db
      .collection('permissions')
      .findOneAndUpdate(
        { name: perm.name },
        { $set: perm },
        { upsert: true, returnDocument: 'after' },
      );
    if (res?._id) {
      permissionMap.set(perm.name, res._id);
    }
  }
  console.log(`✅ Seeded ${permissionMap.size} Permissions.`);

  // Helper to map permission names to Mongo ObjectIds
  const getPermIds = (names: string[]) =>
    names
      .map((n) => permissionMap.get(n))
      .filter((id): id is NonNullable<typeof id> => Boolean(id));

  const ROLES_DEFINITIONS = [
    {
      name: 'Super Admin',
      slug: 'super_admin',
      description: 'Akses penuh ke seluruh sistem portal PKKMB',
      isSystem: true,
      permissions: getPermIds(['manage:all']),
    },
    {
      name: 'Pimpinan BEM & SC',
      slug: 'pimpinan',
      description: 'Monitoring & pengawasan eksekutif PKKMB FT',
      isSystem: true,
      permissions: getPermIds([
        'pkkmb.monitoring.read',
        'pkkmb.announcement.read',
        'pkkmb.schedule.read',
        'pkkmb.grading.read_all',
        'pkkmb.group.read_all',
        'pkkmb.attendance.read',
        'pkkmb.profile.read_own',
        'pkkmb.profile.update_own',
      ]),
    },
    {
      name: 'Ketua Pelaksana',
      slug: 'ketua_pelaksana',
      description: 'Pengawas seluruh modul operasional kepanitiaan',
      isSystem: true,
      permissions: getPermIds([
        'pkkmb.monitoring.read',
        'pkkmb.announcement.read',
        'pkkmb.announcement.create',
        'pkkmb.schedule.read',
        'pkkmb.grading.read_all',
        'pkkmb.group.read_all',
        'pkkmb.attendance.read',
        'pkkmb.profile.read_own',
        'pkkmb.profile.update_own',
        'pkkmb.registration.manage',
        'pkkmb.group.publish',
      ]),
    },
    {
      name: 'Sekretaris Pelaksana',
      slug: 'sekretaris',
      description:
        'Pengelola administrasi pengumuman, jadwal, presensi & berkas',
      isSystem: true,
      permissions: getPermIds([
        'pkkmb.monitoring.read',
        'pkkmb.announcement.read',
        'pkkmb.announcement.create',
        'pkkmb.announcement.update',
        'pkkmb.announcement.publish',
        'pkkmb.schedule.read',
        'pkkmb.schedule.create',
        'pkkmb.schedule.update',
        'pkkmb.attendance.read',
        'pkkmb.attendance.session_create',
        'pkkmb.profile.read_own',
        'pkkmb.profile.update_own',
        'pkkmb.registration.manage',
        'pkkmb.group.publish',
      ]),
    },
    {
      name: 'Bendahara Pelaksana',
      slug: 'bendahara',
      description: 'Pengelola keuangan & monitoring kegiatan',
      isSystem: true,
      permissions: getPermIds([
        'pkkmb.monitoring.read',
        'pkkmb.profile.read_own',
        'pkkmb.profile.update_own',
      ]),
    },
    {
      name: 'Panitia PKKMB',
      slug: 'panitia',
      description: 'Anggota operasional divisi kepanitiaan PKKMB FT',
      isSystem: true,
      permissions: getPermIds([
        'pkkmb.monitoring.read',
        'pkkmb.announcement.read',
        'pkkmb.schedule.read',
        'pkkmb.group.read_own',
        'pkkmb.grading.read_own',
        'pkkmb.grading.create',
        'pkkmb.attendance.checkin',
        'pkkmb.profile.read_own',
        'pkkmb.profile.update_own',
      ]),
    },
    {
      name: 'Mahasiswa Baru',
      slug: 'user',
      description: 'Peserta Mahasiswa Baru PKKMB FT UNESA 2026',
      isSystem: true,
      permissions: getPermIds([
        'pkkmb.announcement.read',
        'pkkmb.schedule.read',
        'pkkmb.group.read_own',
        'pkkmb.task.read',
        'pkkmb.task.submit',
        'pkkmb.attendance.checkin',
        'pkkmb.profile.read_own',
        'pkkmb.profile.update_own',
      ]),
    },
  ];

  console.log('🎭 Seeding Roles...');
  const roleMap = new Map<string, { _id: unknown }>();

  for (const r of ROLES_DEFINITIONS) {
    const res = await db
      .collection('roles')
      .findOneAndUpdate(
        { $or: [{ slug: r.slug }, { name: r.name }] },
        { $set: r },
        { upsert: true, returnDocument: 'after' },
      );
    if (res?._id) {
      roleMap.set(r.slug, res._id);
    }
  }
  console.log(`✅ Seeded ${roleMap.size} Roles.`);

  // Default Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const DEMO_USERS = [
    {
      name: 'Super Admin Utama',
      email: 'superadmin@unesa.ac.id',
      nim: '00000000001',
      roleSlug: 'super_admin',
      division: 'SuperAdmin',
      position: 'Super Admin Sistem',
    },
    {
      name: 'Ketua BEM FT UNESA',
      email: 'ketua.bem@unesa.ac.id',
      nim: '19051204001',
      roleSlug: 'pimpinan',
      division: 'Pimpinan',
      position: 'Ketua BEM FT UNESA',
    },
    {
      name: 'Ketua Pelaksana PKKMB',
      email: 'ketua.pelaksana@unesa.ac.id',
      nim: '19051204002',
      roleSlug: 'ketua_pelaksana',
      division: 'Inti',
      position: 'Ketua Pelaksana PKKMB',
    },
    {
      name: 'Sekretaris Pelaksana',
      email: 'sekretaris@unesa.ac.id',
      nim: '19051204003',
      roleSlug: 'sekretaris',
      division: 'Inti',
      position: 'Sekretaris Pelaksana',
    },
    {
      name: 'Bendahara Pelaksana',
      email: 'bendahara@unesa.ac.id',
      nim: '19051204004',
      roleSlug: 'bendahara',
      division: 'Inti',
      position: 'Bendahara Pelaksana',
    },
    {
      name: 'Koordinator Sie Acara',
      email: 'koor.acara@unesa.ac.id',
      nim: '19051204005',
      roleSlug: 'panitia',
      division: 'Sie Acara',
      position: 'Koordinator Sie Acara',
    },
    {
      name: 'Koordinator Sie Humas',
      email: 'koor.humas@unesa.ac.id',
      nim: '19051204006',
      roleSlug: 'panitia',
      division: 'Sie Humas',
      position: 'Koordinator Sie Humas',
    },
    {
      name: 'Koordinator Sie Pendamping',
      email: 'koor.pendamping@unesa.ac.id',
      nim: '19051204007',
      roleSlug: 'panitia',
      division: 'Sie Pendamping',
      position: 'Koordinator Sie Pendamping',
    },
    {
      name: 'Panitia Sie Pendamping (Pendamping Kelompok 01)',
      email: 'panitia.pendamping@unesa.ac.id',
      nim: '19051204010',
      roleSlug: 'panitia',
      division: 'Sie Pendamping',
      position: 'Anggota Sie Pendamping (Kelompok 01)',
    },
    {
      name: 'MABA Demo (Tegar Akmal)',
      email: 'maba.demo@mhs.unesa.ac.id',
      nim: '26051204001',
      roleSlug: 'user',
      division: 'Peserta',
      position: 'Mahasiswa Baru S1 Teknik Informatika',
      studyProgram: 'S1 Teknik Informatika',
    },
  ];

  console.log('👤 Seeding Default Demo Accounts...');
  for (const u of DEMO_USERS) {
    const roleId = roleMap.get(u.roleSlug);
    if (!roleId) continue;

    await db.collection('users').findOneAndUpdate(
      { email: u.email },
      {
        $set: {
          name: u.name,
          email: u.email.toLowerCase(),
          nim: u.nim,
          password: passwordHash,
          role: roleId,
          division: u.division,
          position: u.position,
          studyProgram: u.studyProgram || 'S1 Teknik Informatika',
          isActive: true,
          isEmailVerified: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
  console.log('✅ Seeded All Default Demo Accounts Successfully!');

  await disconnect();
  console.log('🎉 Idempotent Seeding Completed!');
}

seed().catch((err) => {
  console.error('❌ Seeding Error:', err);
  process.exit(1);
});
